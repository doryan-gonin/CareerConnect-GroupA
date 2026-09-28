import os
from typing import Annotated
from dotenv import load_dotenv
import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from backend.database import get_session
from backend.models import User, RevokedToken

load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set. Create a .env file.")

ALGORITHM = "HS256"
bearer_scheme = HTTPBearer()

def get_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> dict:
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except InvalidTokenError:
        raise error

    jti = payload.get("jti")
    if jti is None:
        raise error

    revoked = session.exec(select(RevokedToken).where(RevokedToken.jti == jti)).first()
    if revoked:
        raise error

    return payload

def get_current_user(
    payload: Annotated[dict, Depends(get_token_payload)],
    session: Annotated[Session, Depends(get_session)]
) -> User:
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")

    user = session.get(User, int(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user