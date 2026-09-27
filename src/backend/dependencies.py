from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session

from backend.database import get_session
from backend.models import User

# Reuse same key and algorithm
# Eventually these should be moved to their own .py file to prevent defining them in multiple files
# Additionally they should not be hardcoded
SECRET_KEY = "VERY_SECRET_KEY"
ALGORITHM = "HS256"

security = HTTPBearer()

def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)], session: Annotated[Session, Depends(get_session)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = session.get(User, int(user_id))
    if user is None:
        raise credentials_exception

    return user