from fastapi import APIRouter, Depends, Query

from backend.database import get_session
from backend.models import (
    User,
    Job,
    Application,
    JobViewLog,
    SearchLog,
    AnalyticsGranularity,
)
from backend.dependencies import get_current_user

router = APIRouter(tags=["Analytics"])


# Require get_current_user
# Accept date range and granularity as query parameters
# Query only rows belonging to current_user.id
# Aggregate SearchLog, Application, JobViewLog and Job
# Return the response schema

