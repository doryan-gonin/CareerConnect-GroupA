from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select, col

from backend.database import get_session
from backend.models import (
    User,
    Job,
    JobResponse,
    SavedJob,
    SavedJobResponse,
    SavedJobListResponse,
)
from backend.dependencies import get_current_applicant

router = APIRouter(tags=["Saved Jobs"])


def _to_response(saved: SavedJob, job: Job) -> SavedJobResponse:
    return SavedJobResponse(
        id=saved.id,
        job_id=saved.job_id,
        saved_at=saved.saved_at,
        job=JobResponse.model_validate(job, from_attributes=True),
    )


@router.get("", response_model=SavedJobListResponse)
def list_saved_jobs(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_applicant)],
):
    """
    Return every job the current user has saved, most recently saved first.
    Jobs that were closed after being saved are still returned (with is_active=False)
    so the user can see what happened to them and remove them.
    """
    rows = session.exec(
        select(SavedJob, Job)
        .join(Job, Job.id == SavedJob.job_id)
        .where(SavedJob.user_id == current_user.id)
        .order_by(col(SavedJob.saved_at).desc(), col(SavedJob.id).desc())
    ).all()

    return SavedJobListResponse(
        total=len(rows),
        saved_jobs=[_to_response(saved, job) for saved, job in rows],
    )


@router.get("/ids", response_model=List[int])
def list_saved_job_ids(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_applicant)],
):
    """Return only the IDs of saved jobs, so the UI can mark bookmarked postings cheaply."""
    return session.exec(
        select(SavedJob.job_id).where(SavedJob.user_id == current_user.id)
    ).all()


@router.post("/{job_id}", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED)
def save_job(
    job_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_applicant)],
):
    """Bookmark an active job posting for the current user."""
    job = session.get(Job, job_id)
    if not job or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found.",
        )

    existing = session.exec(
        select(SavedJob).where(
            SavedJob.user_id == current_user.id,
            SavedJob.job_id == job_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is already saved.",
        )

    saved = SavedJob(user_id=current_user.id, job_id=job_id)
    session.add(saved)
    try:
        session.commit()
    except IntegrityError:
        # Concurrent duplicate save hit the unique constraint
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Job is already saved.",
        )
    session.refresh(saved)

    return _to_response(saved, job)


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def unsave_job(
    job_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_applicant)],
):
    """Remove a job from the current user's saved list."""
    saved = session.exec(
        select(SavedJob).where(
            SavedJob.user_id == current_user.id,
            SavedJob.job_id == job_id,
        )
    ).first()
    if not saved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job is not in your saved list.",
        )

    session.delete(saved)
    session.commit()
    return {"message": "Job removed from saved list."}
