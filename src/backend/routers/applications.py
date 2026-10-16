from datetime import datetime
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, col

from backend.database import get_session
from backend.models import (
    User,
    Job,
    Resume,
    Application,
    ApplicationStatus,
    ApplicationResponse,
    ApplicationDetailResponse,
    ApplicationStatusUpdate,
)
from backend.dependencies import get_current_user

router = APIRouter(tags=["Applications"])


@router.get("/me", response_model=List[ApplicationDetailResponse])
def list_my_applications(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: ApplicationStatus | None = Query(default=None, alias="status", description="Filter by status (Applied, Under Review, Interview, Offered, Rejected)"),
):
    """
    List all applications submitted by the logged-in candidate with full job metadata.
    Sorted by application date descending.
    """
    statement = (
        select(Application, Job, Resume)
        .join(Job, Application.job_id == Job.id)
        .outerjoin(Resume, Application.resume_id == Resume.id)
        .where(Application.applicant_id == current_user.id)
    )

    if status_filter:
        statement = statement.where(Application.status == status_filter)

    statement = statement.order_by(col(Application.applied_at).desc())
    results = session.exec(statement).all()

    application_cards: List[ApplicationDetailResponse] = []
    for app_record, job_record, resume_record in results:
        application_cards.append(
            ApplicationDetailResponse(
                id=app_record.id,
                job_id=app_record.job_id,
                applicant_id=app_record.applicant_id,
                resume_id=app_record.resume_id,
                resume_name=resume_record.file_name if resume_record else None,
                cover_letter=app_record.cover_letter,
                status=app_record.status,
                applied_at=app_record.applied_at,
                updated_at=app_record.updated_at,
                job_title=job_record.title,
                company_name=job_record.company_name,
                location=job_record.location,
                category=job_record.category,
                job_type=job_record.job_type,
                job_schedule=job_record.job_schedule,
            )
        )

    return application_cards


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application(
    application_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Retrieve details of a single application.
    Accessible only to the applicant who submitted it or the recruiter who owns the job posting.
    """
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    job = session.get(Job, application.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated job posting not found.",
        )

    # Authorization check
    if application.applicant_id != current_user.id and job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this application.",
        )

    resume = session.get(Resume, application.resume_id) if application.resume_id else None

    return ApplicationDetailResponse(
        id=application.id,
        job_id=application.job_id,
        applicant_id=application.applicant_id,
        resume_id=application.resume_id,
        resume_name=resume.file_name if resume else None,
        cover_letter=application.cover_letter,
        status=application.status,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        job_title=job.title,
        company_name=job.company_name,
        location=job.location,
        category=job.category,
        job_type=job.job_type,
        job_schedule=job.job_schedule,
    )


@router.delete("/{application_id}", status_code=status.HTTP_200_OK)
def withdraw_application(
    application_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Withdraw a submitted job application.
    Accessible only to the job seeker who created the application.
    """
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    if application.applicant_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to withdraw this application.",
        )

    session.delete(application)
    session.commit()
    return {"message": "Application withdrawn successfully."}


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Update the status of an application (e.g. Applied -> Under Review -> Interview -> Offered / Rejected).
    Restricted to the recruiter who posted the job.
    """
    application = session.get(Application, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    job = session.get(Job, application.job_id)
    if not job or job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update status for this application.",
        )

    application.status = payload.status
    application.updated_at = datetime.now()
    session.add(application)
    session.commit()
    session.refresh(application)

    return ApplicationResponse(
        id=application.id,
        job_id=application.job_id,
        applicant_id=application.applicant_id,
        resume_id=application.resume_id,
        cover_letter=application.cover_letter,
        status=application.status,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        message=f"Application status updated to '{application.status.value}'.",
    )
