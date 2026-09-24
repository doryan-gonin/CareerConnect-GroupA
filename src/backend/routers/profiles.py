# PROFILE AND RESUME ENDPOINTS
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
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
def read_my_profile(current_user: int, session: Annotated[Session, Depends(get_session)]):
    return get_or_create_profile(current_user, session)

# Update profile
# CHANGE /{user_id} to /me when we have authentication, otherwise any user can change the profile of anyone,
# which is funny but bad
@router.put("/{user_id}", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdate, current_user: int, session: Annotated[Session, Depends(get_session)]):

    profile: Profile = get_or_create_profile(current_user, session)

    if payload.first_name is not None:
        profile.first_name = payload.first_name
    if payload.last_name is not None:
        profile.last_name = payload.last_name

    profile.last_updated = datetime.now()

    session.commit()
    session.refresh(profile)
    return profile