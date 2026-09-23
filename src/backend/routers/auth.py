# REGISTRATION AND LOGIN ENDPOINTS
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
import bcrypt
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

    # Hash password
    pw_bytes: bytes = payload.password.encode("utf-8")
    pw_hashed: bytes = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())

    # Turn it back into a string to store it in the database
    pw_hash_str: str = pw_hashed.decode("utf-8")

    new_user: User = User(
        first_name = payload.first_name,
        last_name = payload.last_name,
        email_address = payload.email_address,
        password_hash = pw_hash_str
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.get("/login")
def login_user():
    # TODO: Implement login
    return {"message": "Login placeholder"}