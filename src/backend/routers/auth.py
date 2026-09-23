# REGISTRATION AND LOGIN ENDPOINTS
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from backend.database import get_session
from backend.models import User, UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Endpoint to create a new user
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, session: Annotated[Session, Depends(get_session)]) -> User:

    # Make sure user doesn't already exist
    existing = session.exec(select(User).where(User.email_address == payload.email_address)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    # TODO: REPLACE THIS WITH ACTUAL PASSWORD HASHING LIKE SHA256
    hashed_pw: str = f"hash_{payload.password}"

    new_user: User = User(
        first_name = payload.first_name,
        last_name = payload.last_name,
        email_address = payload.email_address,
        password_hash = hashed_pw
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.get("/login")
def login_user():
    # TODO: Implement login
    return {"message": "Login placeholder"}