from pathlib import Path
from fastapi.responses import FileResponse
import math
from typing import Annotated, List
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlmodel import Session, select, col, or_, func

from backend.database import get_session
from backend.models import (
    User,
    Profile,
    Job,
    JobType,
    JobSchedule,
    JobSortBy,
    JobSortOrder,
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    Resume,
    Application,
    ApplicationStatus,
    ApplicationCreate,
    ApplicationResponse,
    SearchLog,
    JobViewLog,
)
from backend.dependencies import (
    get_current_user,
    get_optional_current_user,
    get_current_recruiter,
    get_current_applicant,
)
from backend.services.notification_service import notify_new_application_received

router = APIRouter(tags=["Jobs"])
@router.get("/mine", response_model=List[JobResponse])
def list_my_jobs(
    current_user: Annotated[User, Depends(get_current_recruiter)],
    session: Annotated[Session, Depends(get_session)],
):
    """
    Return all job postings created by the authenticated recruiter,
    including active and closed postings.
    """
    statement = (
        select(Job)
        .where(Job.recruiter_id == current_user.id)
        .order_by(col(Job.posted_at).desc())
    )

    return session.exec(statement).all()

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
    sort_by: JobSortBy = Query(default=JobSortBy.POSTED_AT, description="Field to sort by (e.g. posted_at, salary)"),
    sort_order: JobSortOrder = Query(default=JobSortOrder.DESC, description="Sort order: asc or desc"),
    current_user: Annotated[User | None, Depends(get_optional_current_user)] = None,
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

    # Pagination and sorting
    sort_columns = {
        JobSortBy.POSTED_AT: Job.posted_at,
        JobSortBy.SALARY_MAX: Job.salary_max,
        JobSortBy.SALARY_MIN: Job.salary_min,
        JobSortBy.HOURS_MAX: Job.max_hours_per_week,
    }

    sort_column = sort_columns[sort_by]

    # nullslast() ensures job without the selected field are pushed to the end
    # The tie-breaker ensures jobs with the same criterias don't jump between pages
    if sort_order == JobSortOrder.ASC:
        primary_order = col(sort_column).asc().nullslast()
        tie_breaker = col(Job.id).asc()
    else:
        primary_order = col(sort_column).desc().nullslast()
        tie_breaker = col(Job.id).desc()

    # Paginate only AFTER sorting
    offset = (page - 1) * limit
    jobs_statement = (
        select(Job)
        .where(*conditions)
        .order_by(primary_order, tie_breaker)
        .offset(offset)
        .limit(limit)
    )

    jobs = session.exec(jobs_statement).all()

    total_pages = math.ceil(total_count / limit) if total_count > 0 else 0

    # Data Harvesting: only log the search query for authenticated users on page 1
    if current_user and page == 1:
        search_log = SearchLog(
            user_id=current_user.id,
            keyword=keyword.strip() if keyword else None,
            location=location.strip() if location else None,
            category=category.strip() if category else None,
            job_type=job_type,
            job_schedule=job_schedule,
            salary_min=min_salary,
            result_count=total_count,
        )
        if(any([keyword, location, category, job_type, job_schedule, min_salary])):
            session.add(search_log)
            session.commit()

    return JobListResponse(
        jobs=list(jobs),
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )



@router.get("/{job_id}/applications")
def get_job_applications(
    job_id: int,
    current_user: Annotated[User, Depends(get_current_recruiter)],
    session: Annotated[Session, Depends(get_session)],
):
    # Verify that the job exists.
    job = session.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # Only the recruiter who owns the job can view applicants.
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only view applicants for your own jobs."
        )

    applications = session.exec(
        select(Application)
        .where(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
    ).all()

    results = []

    for application in applications:
        applicant = session.get(User, application.applicant_id)

        profile = session.exec(
            select(Profile).where(
                Profile.user_id == application.applicant_id
            )
        ).first()

        resume = (
            session.get(Resume, application.resume_id)
            if application.resume_id is not None
            else None
        )

        # Only include a resume if it belongs to the applicant.
        if resume and resume.user_id != application.applicant_id:
            resume = None

        first_name = profile.first_name if profile else ""
        last_name = profile.last_name if profile else ""

        results.append({
            "id": application.id,
            "job_id": application.job_id,
            "applicant_id": application.applicant_id,
            "applicant_name": (
                f"{first_name} {last_name}".strip()
                or f"Applicant #{application.applicant_id}"
            ),
            "applicant_email": (
                str(applicant.email_address) if applicant else None
            ),
            "resume_id": resume.id if resume else None,
            "resume_name": resume.file_name if resume else None,
            "cover_letter": application.cover_letter,
            "status": application.status,
            "applied_at": application.applied_at,
            "updated_at": application.updated_at,
        })

    return results


@router.get("/{job_id}/applications/{application_id}/resume")
def view_applicant_resume(
    job_id: int,
    application_id: int,
    current_user: Annotated[User, Depends(get_current_recruiter)],
    session: Annotated[Session, Depends(get_session)],
):
    # Step 1: Find the job.
    job = session.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    # Step 2: Verify that the current recruiter owns the job.
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this job's resumes."
        )

    # Step 3: Find the application for this specific job.
    application = session.exec(
        select(Application).where(
            Application.id == application_id,
            Application.job_id == job_id,
        )
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found for this job."
        )

    # Step 4: Check that a resume was submitted.
    if application.resume_id is None:
        raise HTTPException(
            status_code=404,
            detail="No resume was submitted with this application."
        )

    # Step 5: Retrieve the resume and verify its owner.
    resume = session.exec(
        select(Resume).where(
            Resume.id == application.resume_id,
            Resume.user_id == application.applicant_id,
        )
    ).first()

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Submitted resume not found."
        )

    # Step 6: Verify that the PDF still exists.
    resume_path = Path(resume.file_path)

    if not resume_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found on server."
        )

    # Step 7: Return the PDF for viewing.
    return FileResponse(
        path=str(resume_path),
        media_type="application/pdf",
        filename=resume.file_name,
        content_disposition_type="inline",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(
    job_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)] = None,
):
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

    # Record only the first view for each authenticated user/job pair.
    if current_user and not session.exec(
        select(JobViewLog).where(
            JobViewLog.user_id == current_user.id,
            JobViewLog.job_id == job.id,
        )
    ).first():
        view_log = JobViewLog(
            user_id=current_user.id,
            job_id=job.id,
        )
        session.add(view_log)
        session.commit()

    return job


@router.post("/{job_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_job_view(
    job_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    """Record the first view of an active job for the current user."""
    job = session.get(Job, job_id)
    if not job or not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found.",
        )

    existing_view = session.exec(
        select(JobViewLog).where(
            JobViewLog.user_id == current_user.id,
            JobViewLog.job_id == job.id,
        )
    ).first()
    if not existing_view:
        session.add(JobViewLog(user_id=current_user.id, job_id=job.id))
        session.commit()


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: Annotated[User, Depends(get_current_recruiter)],
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
    current_user: Annotated[User, Depends(get_current_recruiter)],
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
    current_user: Annotated[User, Depends(get_current_recruiter)],
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
    current_user: Annotated[User, Depends(get_current_applicant)],
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

    # Notify recruiter about the new application
    notify_new_application_received(
        session=session,
        job=job,
        application=application,
        applicant=current_user,
    )

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
