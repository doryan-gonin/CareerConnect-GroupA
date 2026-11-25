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
    JobSuggestion,
)
from backend.dependencies import (
    get_current_user,
    get_optional_current_user,
    get_current_recruiter,
    get_current_applicant,
)
from backend.services.notification_service import notify_new_application_received
from backend.services.suggestion_service import get_cached_suggestions, refresh_suggestions

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


@router.post("/suggestions/refresh")
def refresh_job_suggestions(
    current_user: Annotated[User, Depends(get_current_applicant)],
    session: Annotated[Session, Depends(get_session)],
):
    """Refresh the login-time recommendation cache on demand."""
    rows = refresh_suggestions(session, current_user)
    return {"count": len(rows), "generated_at": max((row.generated_at for row in rows), default=None)}

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
    ai_suggested: bool = Query(default=False, description="Only jobs in the authenticated user's AI suggestion cache"),
    refresh_suggestions: bool = Query(default=False, description="Refresh the suggestion cache before filtering"),
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

    suggestion_by_job: dict[int, JobSuggestion] = {}
    if sort_by == JobSortBy.SUGGESTION:
        ai_suggested = True
    if ai_suggested:
        if current_user is None or current_user.is_recruiter:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in as an applicant to use AI suggestions.")
        suggestion_by_job = get_cached_suggestions(session, current_user, refresh=refresh_suggestions)
        suggested_ids = list(suggestion_by_job)
        conditions.append(Job.id.in_(suggested_ids or [-1]))

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

    sort_column = sort_columns.get(sort_by)

    if ai_suggested:
        all_jobs = session.exec(select(Job).where(*conditions)).all()
        all_jobs = sorted(
            all_jobs,
            key=lambda item: (suggestion_by_job.get(item.id).score if suggestion_by_job.get(item.id) else 0.0, item.id or 0),
            reverse=sort_order == JobSortOrder.DESC,
        )
        offset = (page - 1) * limit
        jobs = all_jobs[offset:offset + limit]
    else:
        # nullslast() ensures job without the selected field are pushed to the end
        # The tie-breaker ensures jobs with the same criteria don't jump between pages
        if sort_column is None:
            raise HTTPException(status_code=422, detail="Unsupported sort field")

        if sort_order == JobSortOrder.ASC:
            primary_order = col(sort_column).asc().nullslast()
            tie_breaker = col(Job.id).asc()
        else:
            primary_order = col(sort_column).desc().nullslast()
            tie_breaker = col(Job.id).desc()

        offset = (page - 1) * limit
        jobs_statement = select(Job).where(*conditions).order_by(primary_order, tie_breaker).offset(offset).limit(limit)
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

    response_jobs = []
    for job in jobs:
        suggestion = suggestion_by_job.get(job.id)
        data = {field: getattr(job, field) for field in (
            "id", "recruiter_id", "title", "company_name", "description", "location", "category",
            "job_type", "job_schedule", "min_hours_per_week", "max_hours_per_week", "salary_min",
            "salary_max", "is_active", "posted_at")}
        data.update(ai_suggested=bool(suggestion), suggestion_score=suggestion.score if suggestion else None,
                    suggestion_justification=suggestion.justification if suggestion else None)
        response_jobs.append(JobResponse(**data))

    return JobListResponse(
        jobs=response_jobs,
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

    profile = current_user.profile
    if payload and payload.links is not None:
        links_snapshot = payload.links
    elif profile:
        links_snapshot = [{"link_type": l.link_type.value, "url": l.url} for l in profile.links]
    else:
        links_snapshot = []

    if payload and payload.languages is not None:
        languages_snapshot = payload.languages
    elif profile:
        languages_snapshot = [
            {"language": l.language, "fluency_level": l.fluency_level.value}
            for l in profile.languages
        ]
    else:
        languages_snapshot = []

    if payload and payload.education is not None:
        education_snapshot = payload.education
    elif profile:
        education_snapshot = [
            {
                "institution": e.institution,
                "degree": e.degree,
                "field_of_study": e.field_of_study,
                "start_date": e.start_date.isoformat() if e.start_date else None,
                "end_date": e.end_date.isoformat() if e.end_date else None,
                "description": e.description,
            }
            for e in profile.education
        ]
    else:
        education_snapshot = []

    if payload and payload.experience is not None:
        experience_snapshot = payload.experience
    elif profile:
        experience_snapshot = [
            {
                "company_name": ex.company_name,
                "job_title": ex.job_title,
                "start_date": ex.start_date.isoformat() if ex.start_date else None,
                "end_date": ex.end_date.isoformat() if ex.end_date else None,
                "description": ex.description,
            }
            for ex in profile.experience
        ]
    else:
        experience_snapshot = []

    application = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        resume_id=target_resume_id,
        cover_letter=cover_letter,
        links=links_snapshot,
        languages=languages_snapshot,
        education=education_snapshot,
        experience=experience_snapshot,
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
        links=application.links,
        languages=application.languages,
        education=application.education,
        experience=application.experience,
        status=application.status,
        applied_at=application.applied_at,
        updated_at=application.updated_at,
        message="Application submitted successfully.",
    )
