# PROFILE AND RESUME ENDPOINTS
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import (
    User,
    Profile,
    ProfileLink,
    ProfileLanguage,
    ProfileEducation,
    ProfileExperience,
    Resume,
    ProfileUpdate,
    ProfileResponse,
    ProfileLinkCreate,
    ProfileLinkResponse,
    ProfileLanguageCreate,
    ProfileLanguageResponse,
    ProfileEducationCreate,
    ProfileEducationResponse,
    ProfileExperienceCreate,
    ProfileExperienceResponse,
    ResumeReponse,
)
from backend.dependencies import get_current_user, get_current_applicant
from backend.config import UPLOAD_DIR

router = APIRouter(tags=["Profiles"])

# Helper to ensure user has a profile
def get_or_create_profile(user_id: int, session: Session) -> Profile:
    profile: Profile | None = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if not profile:
        profile = Profile(user_id=user_id, first_name="", last_name="")
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile

# Get profile
@router.get("/me", response_model=ProfileResponse)
def read_my_profile(current_user: Annotated[User, Depends(get_current_user)], session: Annotated[Session, Depends(get_session)]):
    return get_or_create_profile(current_user.id, session)

# Update profile
@router.put("/me", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdate, current_user: Annotated[User, Depends(get_current_user)], session: Annotated[Session, Depends(get_session)]):

    profile: Profile = get_or_create_profile(current_user.id, session)

    if payload.first_name is not None:
        profile.first_name = payload.first_name
    if payload.last_name is not None:
        profile.last_name = payload.last_name

    profile.last_updated = datetime.now(timezone.utc)

    session.commit()
    session.refresh(profile)
    return profile


# ----------------
# PROFILE LINKS, LANGUAGES, EDUCATION, EXPERIENCE
# ----------------

@router.post("/me/links", response_model=ProfileLinkResponse, status_code=status.HTTP_201_CREATED)
def add_profile_link(
    payload: ProfileLinkCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    existing = session.exec(
        select(ProfileLink).where(
            ProfileLink.profile_id == profile.id,
            ProfileLink.link_type == payload.link_type,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A {payload.link_type.value} link already exists on this profile.",
        )

    link = ProfileLink(profile_id=profile.id, link_type=payload.link_type, url=payload.url)
    profile.last_updated = datetime.now(timezone.utc)
    session.add(link)
    session.add(profile)
    session.commit()
    session.refresh(link)
    return link


@router.delete("/me/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_link(
    link_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    link = session.exec(
        select(ProfileLink).where(ProfileLink.id == link_id, ProfileLink.profile_id == profile.id)
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")

    profile.last_updated = datetime.now(timezone.utc)
    session.delete(link)
    session.add(profile)
    session.commit()


@router.post("/me/languages", response_model=ProfileLanguageResponse, status_code=status.HTTP_201_CREATED)
def add_profile_language(
    payload: ProfileLanguageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    lang = ProfileLanguage(
        profile_id=profile.id,
        language=payload.language,
        fluency_level=payload.fluency_level,
    )
    profile.last_updated = datetime.now(timezone.utc)
    session.add(lang)
    session.add(profile)
    session.commit()
    session.refresh(lang)
    return lang


@router.delete("/me/languages/{language_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_language(
    language_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    lang = session.exec(
        select(ProfileLanguage).where(
            ProfileLanguage.id == language_id,
            ProfileLanguage.profile_id == profile.id,
        )
    ).first()
    if not lang:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found.")

    profile.last_updated = datetime.now(timezone.utc)
    session.delete(lang)
    session.add(profile)
    session.commit()


@router.post("/me/education", response_model=ProfileEducationResponse, status_code=status.HTTP_201_CREATED)
def add_profile_education(
    payload: ProfileEducationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    edu = ProfileEducation(
        profile_id=profile.id,
        institution=payload.institution,
        degree=payload.degree,
        field_of_study=payload.field_of_study,
        start_date=payload.start_date,
        end_date=payload.end_date,
        description=payload.description,
    )
    profile.last_updated = datetime.now(timezone.utc)
    session.add(edu)
    session.add(profile)
    session.commit()
    session.refresh(edu)
    return edu


@router.delete("/me/education/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_education(
    education_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    edu = session.exec(
        select(ProfileEducation).where(
            ProfileEducation.id == education_id,
            ProfileEducation.profile_id == profile.id,
        )
    ).first()
    if not edu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Education entry not found.")

    profile.last_updated = datetime.now(timezone.utc)
    session.delete(edu)
    session.add(profile)
    session.commit()


@router.post("/me/experience", response_model=ProfileExperienceResponse, status_code=status.HTTP_201_CREATED)
def add_profile_experience(
    payload: ProfileExperienceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    exp = ProfileExperience(
        profile_id=profile.id,
        company_name=payload.company_name,
        job_title=payload.job_title,
        start_date=payload.start_date,
        end_date=payload.end_date,
        description=payload.description,
    )
    profile.last_updated = datetime.now(timezone.utc)
    session.add(exp)
    session.add(profile)
    session.commit()
    session.refresh(exp)
    return exp


@router.delete("/me/experience/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_experience(
    experience_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    profile = get_or_create_profile(current_user.id, session)
    exp = session.exec(
        select(ProfileExperience).where(
            ProfileExperience.id == experience_id,
            ProfileExperience.profile_id == profile.id,
        )
    ).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience entry not found.")

    profile.last_updated = datetime.now(timezone.utc)
    session.delete(exp)
    session.add(profile)
    session.commit()


# ----------------
# RESUME ENDPOINTS
# ----------------

# Get all resumes
@router.get("/me/resumes", response_model=List[ResumeReponse])
def list_resumes(current_user: Annotated[User, Depends(get_current_applicant)], session: Annotated[Session, Depends(get_session)]):
    resumes = session.exec(select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.is_default.desc(), Resume.uploaded_at.desc())).all()
    return resumes

# Get specific resume
@router.get("/me/resumes/{resume_id}")
def download_resume(resume_id: int, current_user: Annotated[User, Depends(get_current_applicant)], session: Annotated[Session, Depends(get_session)]):
    resume = session.exec(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)).first()

    if not resume or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found on server.")

    return FileResponse(path=resume.file_path, media_type="application/pdf", filename=resume.file_name)

# Upload resume
@router.post("/me/resumes", response_model=ResumeReponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(file: Annotated[UploadFile, File(...)],
                  current_user: Annotated[User, Depends(get_current_applicant)], 
                  session: Annotated[Session, Depends(get_session)],
                  make_default: bool = False):
    
    # Enforce pdf
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pdf files are allowed.")

    # Check if file size is bigger than 5 megabytes
    max_size = 5 * 1024 * 1024
    total_bytes = 0

    # Read 1 megabyte at a time
    while chunk := await file.read(1024 * 1024):
        total_bytes += len(chunk)
        if total_bytes > max_size:
            # FastAPI uses starlette which temporarily stores files > 1mb on disk to save RAM so closing the file deletes the temp file
            await file.close()
            raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Resume must be under 5 megabytes.")

    await file.seek(0)

    # Check existing resumes count
    existing_resumes = session.exec(select(Resume).where(Resume.user_id == current_user.id)).all()

    # Limit amout of resumes on an account to 5
    if len(existing_resumes) >= 5:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User already has 5 (or more) resumes.")

    # First resume is automatically default
    is_first = len(existing_resumes) == 0
    should_be_default = is_first or make_default

    if should_be_default:
        for r in existing_resumes:
            r.is_default = False
            session.add(r)

    # Save file to disk
    unique_file_name = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path: Path = UPLOAD_DIR / unique_file_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update SQL resumes
    new_resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=str(file_path),
        is_default=should_be_default
    )

    await file.close()

    session.add(new_resume)
    session.commit()
    session.refresh(new_resume)
    return new_resume

# Set default resume
@router.patch("/me/resumes/{resume_id}/default", response_model=ResumeReponse)
def set_default_resume(resume_id: int, current_user: Annotated[User, Depends(get_current_applicant)], session: Annotated[Session, Depends(get_session)]):
    target_resume = session.exec(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)).first()

    if not target_resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    all_resumes = session.exec(select(Resume).where(Resume.user_id == current_user.id)).all()
    for r in all_resumes:
        r.is_default = (r.id == target_resume.id)
        session.add(r)

    session.commit()
    session.refresh(target_resume)
    return target_resume

# Delete resume
@router.delete("/me/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: int, current_user: Annotated[User, Depends(get_current_applicant)], session: Annotated[Session, Depends(get_session)]):
    resume = session.exec(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)).first()

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    was_default = resume.is_default

    # Delete file from server
    if os.path.exists(resume.file_path):
        os.remove(resume.file_path)

    # Delete database entry
    session.delete(resume)
    session.commit()

    # If deleted resume was default, assign the most recently uploaded resume as default
    if was_default:
        fallback = session.exec(
            select(Resume)
            .where(Resume.user_id == current_user.id)
            .order_by(Resume.uploaded_at.desc())
            ).first()

        if fallback:
            fallback.is_default = True
            session.add(fallback)
            session.commit()
