# REGISTRATION AND LOGIN ENDPOINTS
from datetime import datetime,timedelta, timezone
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError #Eventually TimeOutError too
from sqlmodel import Session, select
import bcrypt
from backend.database import get_session
from backend.models import User, UserCreate, UserResponse, UserLogin, Token, TokenData

import os
from dotenv import load_detenv

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# TODO: Refresh token while user is active (get a new one when the old one expires)
# TODO: Add a logout endpoint that invalidates the token (blacklist?)
# ----------------------------------------------------------------------------------------------
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set. Creat a .env file (see. env.example)")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# ----------------------------------------------------------------------------------------------

# Endpoint to create a new user
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, session: Annotated[Session, Depends(get_session)]) -> User:
    # Normalize email
    clean_email = payload.email_address.strip().casefold()

    # Make sure user doesn't already exist
    existing = session.exec(select(User).where(User.email_address == clean_email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    # Hash password
    pw_bytes: bytes = payload.password.encode("utf-8")
    pw_hashed: bytes = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())

    # Turn it back into a string to store it in the database
    pw_hash_str: str = pw_hashed.decode("utf-8")

    new_user: User = User(
        email_address = clean_email,
        password_hash = pw_hash_str
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token) # Logging in requires a POST request with email and password (GET stores info in URL so not secure)
def login_user(payload: UserLogin, session: Annotated[Session, Depends(get_session)]):
    # User Lookup
    user = session.exec(select(User).where(User.email_address == payload.email_address.strip().casefold())).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.") # Generic 401 response

    #Locked out?
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Too many failed attempts. Try again later."
        )

    # bcrypt verification
    if user:
        if not bcrypt.checkpw(payload.password.encode("utf-8"), user.password_hash.encode("utf-8")):
            user.failed_attempts += 1
            if user.failed_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            session.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    # Success: reset counters
    user.failed_attempts = 0
    user.locked_until = None
    session.commit()
    
    # JWT Generation and response
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": str(user.id)}, # We use the ID as the email might change AND is PII
        expires_delta=access_token_expires)
    
    return {"access_token": access_token, "token_type": "bearer"}

# Authentication dependency to verify the token is valid (used for other endpoints that need authentication)
# When retrieving the user from the token, we need to convert ID back to int to query the DB
