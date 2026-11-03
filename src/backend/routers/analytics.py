from datetime import date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from backend.database import get_session
from backend.models import (
    User,
    AnalyticsGranularity,
    ApplicationAnalyticsResponse,
    ApplicationSummaryResponse,
    SalaryDistributionResponse,
    SearchAnalyticsResponse,
    ViewAnalyticsResponse,
)

from backend.dependencies import get_current_user
from backend.services.analytics_service import (
    compute_application_analytics,
    compute_application_summary,
    compute_salary_distribution,
    compute_search_analytics,
    compute_view_analytics,
)

router = APIRouter(tags=["Analytics"])

# Date validation helper
def validate_dates(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date.",
        )

# Endpoints
@router.get("/applications", response_model=ApplicationAnalyticsResponse)
def get_application_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity = AnalyticsGranularity.DAY,
):
    validate_dates(start_date, end_date)

    return compute_application_analytics(session, current_user.id, start_date, end_date, group_by)

@router.get("/searches", response_model=SearchAnalyticsResponse)
def get_search_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity = AnalyticsGranularity.DAY,
):
    validate_dates(start_date, end_date)

    return compute_search_analytics(session, current_user.id, start_date, end_date, group_by)

@router.get("/views", response_model=ViewAnalyticsResponse)
def get_view_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity = AnalyticsGranularity.DAY,
):
    validate_dates(start_date, end_date)

    return compute_view_analytics(session, current_user.id, start_date, end_date, group_by)

@router.get("/salary-distribution", response_model=SalaryDistributionResponse)
def get_salary_distribution(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    start_date: date,
    end_date: date,
):
    validate_dates(start_date, end_date)

    return compute_salary_distribution(session, current_user.id, start_date, end_date)

@router.get("/application-summary", response_model=ApplicationSummaryResponse)
def get_application_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    start_date: date,
    end_date: date,
):
    validate_dates(start_date, end_date)

    return compute_application_summary(session, current_user.id, start_date, end_date)
