from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from backend.database import get_session
from backend.models import User, ProfileResponse

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int, session: Annotated[Session, Depends(get_session)]):
    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user