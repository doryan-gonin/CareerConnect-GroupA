# PROFILE AND RESUME ENDPOINTS
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import User, Profile, ProfileUpdate, ProfileResponse

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
# CHANGE /{user_id} to /me or something when we have authentication to prevent getting the profile of any user
@router.get("/{user_id}", response_model=ProfileResponse)
def read_my_profile(user_id: int, session: Annotated[Session, Depends(get_session)]):
    return get_or_create_profile(user_id, session)

# Update profile
# CHANGE /{user_id} to /me when we have authentication, otherwise any user can change the profile of anyone,
# which is funny but bad
@router.put("/{user_id}", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdate, user_id: int, session: Annotated[Session, Depends(get_session)]):

    profile: Profile = get_or_create_profile(user_id, session)

    if payload.first_name is not None:
        profile.first_name = payload.first_name
    if payload.last_name is not None:
        profile.last_name = payload.last_name

    profile.last_updated = datetime.now()

    session.commit()
    session.refresh(profile)
    return profile

# Upload resume
# Change /{user_id} to /me otherwise bad things will happen, housing costs will go up, groceries will become unaffordable
# and you will get holes in your socks
@router.post("/{user_id}/resume", response_model=ProfileResponse)
def upload_resume(file: Annotated[UploadFile, File(...)], user_id: int, session: Annotated[Session, Depends(get_session)]):
    # Enforce pdf
    if not file.filename.lower().endswith(".pdf") or file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pdf files are allowed.")

    # Save file to disk
    file_path: Path = UPLOAD_DIR / f"user_{user_id}_resume.pdf"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update SQL profile
    profile = get_or_create_profile(user_id, session)
    profile.resume_path = str(file_path)
    profile.last_updated = datetime.now()

    session.commit()
    session.refresh(profile)
    return profile

# Get resume
@router.get("/{user_id}/resume")
def download_resume(user_id: int, session: Annotated[Session, Depends(get_session)]):
    profile = get_or_create_profile(user_id, session)

    if not profile.resume_path or not os.path.exists(profile.resume_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume found for this user.")

    return FileResponse(path=profile.resume_path, media_type="application/pdf", filename=f"{profile.first_name or 'user'}_resume.pdf")