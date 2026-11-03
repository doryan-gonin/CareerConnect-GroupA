from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from backend.database import get_session
from backend.models import (
    User,
    AnalyticsGranularity,
    ApplicationAnalyticsResponse,
)
from backend.dependencies import get_current_user
from backend.services.analytics_service import compute_application_analytics

router = APIRouter(tags=["Analytics"])


@router.get("/applications", response_model=ApplicationAnalyticsResponse)
def get_application_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity = AnalyticsGranularity.DAY,
):
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date.",
        )

    return compute_application_analytics(
        session=session,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
    )
