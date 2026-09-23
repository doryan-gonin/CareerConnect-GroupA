# PROFILE AND RESUME ENDPOINTS
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from backend.database import get_session

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

