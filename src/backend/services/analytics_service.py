from datetime import date, datetime, time, timedelta
from sqlmodel import Session, select

from backend.models import (
    AnalyticsGranularity,
    AnalyticsPoint,
    Application,
    ApplicationAnalyticsResponse,
)


# Computes the analytics data for the CareerConnect application when requested by the endpoints

def compute_application_analytics(
    session: Session,
    user_id: int,
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity
) -> ApplicationAnalyticsResponse:

    start_datetime = datetime.combine(start_date, time.min)
    end_datetime = datetime.combine(end_date + timedelta(days=1), time.min)

    # Query the DB to get all applications for the user within the specified date range
    # Maybe that would be good to have separated to a different function to query only once for multiple endpoints
    applications = session.exec(
        select(Application.applied_at).where(
            Application.applicant_id == user_id,
            Application.applied_at >= start_datetime,
            Application.applied_at < end_datetime,
        )
    ).all()

    # Helper functions to get the start and next period based on granularity
    def period_start(value: datetime) -> date:
        if group_by == AnalyticsGranularity.DAY:
            return value.date()
        if group_by == AnalyticsGranularity.WEEK:
            return (value - timedelta(days=value.weekday())).date()
        return value.date().replace(day=1)

    def next_period(value: date) -> date:
        if group_by == AnalyticsGranularity.MONTH:
            if value.month == 12:
                return date(value.year + 1, 1, 1)
            return date(value.year, value.month + 1, 1)
        return value + timedelta(
            days=7 if group_by == AnalyticsGranularity.WEEK else 1
        )

    # Counts the applications that match the periods
    first_period = period_start(start_datetime)
    last_period = period_start(datetime.combine(end_date, time.min))
    counts: dict[date, int] = {}
    current_period = first_period
    while current_period <= last_period:
        counts[current_period] = 0
        current_period = next_period(current_period)

    for applied_at in applications:
        period = period_start(applied_at)
        if period in counts:
            counts[period] += 1

    return ApplicationAnalyticsResponse(
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        points=[
            AnalyticsPoint(period=period, count=count)
            for period, count in counts.items()
        ],
    )
