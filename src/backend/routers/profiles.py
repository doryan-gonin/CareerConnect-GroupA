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
from backend.models import User, Profile, Resume, ProfileUpdate, ProfileResponse, ResumeReponse
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

UPLOAD_DIR: Path = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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

    profile.last_updated = datetime.now()

    session.commit()
    session.refresh(profile)
    return profile


# ----------------
# RESUME ENDPOINTS
# ----------------

# Get all resumes
@router.get("/me/resumes", response_model=List[ResumeReponse])
def list_resumes(current_user: Annotated[User, Depends(get_current_user)], session: Annotated[Session, Depends(get_session)]):
    resumes = session.exec(select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.is_default.desc(), Resume.uploaded_at.desc())).all()
    return resumes

# Get specific resume
@router.get("/me/resumes/{resume_id}")
def download_resume(resume_id: int, current_user: Annotated[User, Depends(get_current_user)], session: Annotated[Session, Depends(get_session)]):
    resume = session.exec(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)).first()

    if not resume or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found on server.")

    return FileResponse(path=resume.file_path, media_type="application/pdf", filename=resume.file_name)

# Upload resume
@router.post("/me/resumes", response_model=ResumeReponse, status_code=status.HTTP_201_CREATED)
def upload_resume(file: Annotated[UploadFile, File(...)],
                  current_user: Annotated[User, Depends(get_current_user)], 
                  session: Annotated[Session, Depends(get_session)],
                  make_default: bool = False):
    
    # Enforce pdf
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pdf files are allowed.")

    # Check if file size is bigger than 5 megabytes
    if file.size > 5000000:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Resume must be under 5 megabytes.")

    # Check existing resumes count
    existing_resumes = session.exec(select(Resume).where(Resume.user_id == current_user.id)).all()

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

    session.add(new_resume)
    session.commit()
    session.refresh(new_resume)
    return new_resume

# Set default resume
@router.patch("/me/resumes/{resume_id}/default", response_model=ResumeReponse)
def set_default_resume(resume_id: int, current_user: Annotated[User, Depends(get_current_user)], session: Annotated[Session, Depends(get_session)]):
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
def delete_resume(resume_id: int, current_user: Annotated[User, Depends(get_current_user)], session: Annotated[Session, Depends(get_session)]):
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