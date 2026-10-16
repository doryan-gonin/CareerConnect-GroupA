import math
from typing import Annotated, List
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlmodel import Session, select, col, or_, func

from backend.database import get_session
from backend.models import (
    User,
    Job,
    JobType,
    JobSchedule,
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    Resume,
    Application,
    ApplicationStatus,
    ApplicationCreate,
    ApplicationResponse,
)
from backend.dependencies import get_current_user

router = APIRouter(tags=["Jobs"])


@router.get("", response_model=JobListResponse)
def list_jobs(
    session: Annotated[Session, Depends(get_session)],
    keyword: str | None = Query(default=None, description="Search term across title, company, or description"),
    location: str | None = Query(default=None, description="Location filter (e.g. city, province, or remote)"),
    category: str | None = Query(default=None, description="Category filter (e.g. Software, Design, Finance)"),
    job_type: JobType | None = Query(default=None, description="Job type (Permanent, Temporary, Contract, etc.)"),
    job_schedule: JobSchedule | None = Query(default=None, description="Work schedule (Full-time, Part-time)"),
    min_salary: int | None = Query(default=None, ge=0, description="Minimum salary filter"),
    min_hours: int | None = Query(default=None, ge=0, description="Minimum hours per week"),
    max_hours: int | None = Query(default=None, ge=0, description="Maximum hours per week"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
):
    """
    Search and filter active job opportunities with pagination.
    Returns full job objects so clients can render listing cards without subsequent API calls.
    """
    conditions = [Job.is_active == True]

    if keyword and keyword.strip():
        term = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                col(Job.title).ilike(term),
                col(Job.company_name).ilike(term),
                col(Job.description).ilike(term),
            )
        )

    if location and location.strip():
        loc_term = f"%{location.strip()}%"
        conditions.append(col(Job.location).ilike(loc_term))

    if category and category.strip():
        cat_term = f"%{category.strip()}%"
        conditions.append(col(Job.category).ilike(cat_term))

    if job_type:
        conditions.append(Job.job_type == job_type)

    if job_schedule:
        conditions.append(Job.job_schedule == job_schedule)

    if min_salary is not None:
        conditions.append(
            or_(
                col(Job.salary_max) >= min_salary,
                col(Job.salary_min) >= min_salary,
            )
        )

    if min_hours is not None:
        conditions.append(
            or_(
                col(Job.min_hours_per_week) >= min_hours,
                col(Job.max_hours_per_week) >= min_hours,
            )
        )

    if max_hours is not None:
        conditions.append(
            or_(
                col(Job.max_hours_per_week) <= max_hours,
                col(Job.min_hours_per_week) <= max_hours,
            )
        )

    # Total count query
    count_statement = select(func.count()).select_from(Job).where(*conditions)
    total_count = session.exec(count_statement).one()

    # Paginated data query
    offset = (page - 1) * limit
    jobs_statement = (
        select(Job)
        .where(*conditions)
        .order_by(col(Job.posted_at).desc())
        .offset(offset)
        .limit(limit)
    )
    jobs = session.exec(jobs_statement).all()

    total_pages = math.ceil(total_count / limit) if total_count > 0 else 0

    return JobListResponse(
        jobs=list(jobs),
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, session: Annotated[Session, Depends(get_session)]):
    """
    Fetch complete details for a single job posting.
    Returns 404 if not found or inactive.
    """
    job = session.get(Job, job_id)
    if not job or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found.",
        )
    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """
    Create a new job posting. Requires user authentication.
    Links the job to the current authenticated user as recruiter.
    """
    job = Job(
        recruiter_id=current_user.id,
        title=payload.title,
        company_name=payload.company_name,
        description=payload.description,
        location=payload.location,
        category=payload.category,
        job_type=payload.job_type,
        job_schedule=payload.job_schedule,
        min_hours_per_week=payload.min_hours_per_week,
        max_hours_per_week=payload.max_hours_per_week,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """
    Update an existing job posting. Only the recruiter who created it may modify it.
    """
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found.",
        )

    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this job posting.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    session.commit()
    session.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
    job_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """
    Soft-delete a job posting by setting is_active to False.
    Only the recruiter who created it may delete it.
    """
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found.",
        )

    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this job posting.",
        )

    job.is_active = False
    session.commit()
    return {"message": "Job posting deactivated successfully."}


@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    payload: Annotated[ApplicationCreate | None, Body()] = None,
):
    """
    Submit an application to an active job posting.
    - Resolves resume: uses specified resume_id if valid, otherwise falls back to the user's default resume.
    - Prevents self-application by the recruiter who created the posting.
    - Prevents duplicate applications for the same job by the same user.
    """
    job = session.get(Job, job_id)
    if not job or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found or is no longer active.",
        )

    if job.recruiter_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recruiters cannot apply to their own job postings.",
        )

    # Check for duplicate application
    existing = session.exec(
        select(Application).where(
            Application.job_id == job_id,
            Application.applicant_id == current_user.id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job posting.",
        )

    # Resolve resume
    target_resume_id: int | None = None
    if payload and payload.resume_id is not None:
        target_resume = session.exec(
            select(Resume).where(
                Resume.id == payload.resume_id,
                Resume.user_id == current_user.id,
            )
        ).first()
        if not target_resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified resume not found on your profile.",
            )
        target_resume_id = target_resume.id
    else:
        # Fall back to user's default resume, or the most recent resume
        default_resume = session.exec(
            select(Resume).where(
                Resume.user_id == current_user.id,
                Resume.is_default == True,
            )
        ).first()
        if not default_resume:
            default_resume = session.exec(
                select(Resume)
                .where(Resume.user_id == current_user.id)
                .order_by(Resume.uploaded_at.desc())
            ).first()

        if not default_resume:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must upload a resume before applying for a job.",
            )
        target_resume_id = default_resume.id

    cover_letter = payload.cover_letter if payload else None

    application = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        resume_id=target_resume_id,
        cover_letter=cover_letter,
        status=ApplicationStatus.APPLIED,
    )
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
        message="Application submitted successfully.",
    )
