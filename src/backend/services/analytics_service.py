from datetime import date, datetime, time, timedelta
from math import sqrt
from sqlmodel import Session, select

from backend.models import (
    AnalyticsGranularity,
    AnalyticsPoint,
    Application,
    ApplicationAnalyticsResponse,
    ApplicationSummaryResponse,
    Job,
    JobViewLog,
    SalaryDistributionResponse,
    SearchAnalyticsResponse,
    SearchLog,
    ViewAnalyticsPoint,
    ViewAnalyticsResponse,
)

# ---------------------------------- HELPERS -----------------------------------
def _period_start(value: datetime, group_by: AnalyticsGranularity) -> date:
    if group_by == AnalyticsGranularity.DAY:
        return value.date()
    if group_by == AnalyticsGranularity.WEEK:
        return (value - timedelta(days=value.weekday())).date()
    return value.date().replace(day=1)

def _periods_between(
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity,
) -> list[date]:
    periods: list[date] = []
    current_period = _period_start(
        datetime.combine(start_date, time.min), group_by
    )
    last_period = _period_start(datetime.combine(end_date, time.min), group_by)
    while current_period <= last_period:
        periods.append(current_period)
        if group_by == AnalyticsGranularity.MONTH:
            if current_period.month == 12:
                current_period = date(current_period.year + 1, 1, 1)
            else:
                current_period = date(
                    current_period.year, current_period.month + 1, 1
                )
        else:
            current_period += timedelta(
                days=7 if group_by == AnalyticsGranularity.WEEK else 1
            )
    return periods

def _date_range(start_date: date, end_date: date) -> tuple[datetime, datetime]:
    return (
        datetime.combine(start_date, time.min),
        datetime.combine(end_date + timedelta(days=1), time.min),
    )

# ---------------------------------- Compute -----------------------------------
def compute_application_analytics(
    session: Session,
    user_id: int,
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity
) -> ApplicationAnalyticsResponse:

    start_datetime, end_datetime = _date_range(start_date, end_date)

    # Query the DB to get all applications for the user within the specified date range
    applications = session.exec(
        select(Application.applied_at).where(
            Application.applicant_id == user_id,
            Application.applied_at >= start_datetime,
            Application.applied_at < end_datetime,
        )
    ).all()

    # Counts the applications that match the periods
    counts = {period: 0 for period in _periods_between(start_date, end_date, group_by)}
    for applied_at in applications:
        period = _period_start(applied_at, group_by)
        if period in counts:
            counts[period] += 1

    # Return the analytics response with the computed counts
    return ApplicationAnalyticsResponse(
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        points=[
            AnalyticsPoint(period=period, count=count)
            for period, count in counts.items()
        ],
    )

def compute_search_analytics(
    session: Session,
    user_id: int,
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity,
) -> SearchAnalyticsResponse:
    start_datetime, end_datetime = _date_range(start_date, end_date)

    searched_at_values = session.exec(
        select(SearchLog.searched_at).where(
            SearchLog.user_id == user_id,
            SearchLog.searched_at >= start_datetime,
            SearchLog.searched_at < end_datetime,
        )
    ).all()

    counts = {period: 0 for period in _periods_between(start_date, end_date, group_by)}
    for searched_at in searched_at_values:
        period = _period_start(searched_at, group_by)
        if period in counts:
            counts[period] += 1

    return SearchAnalyticsResponse(
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        points=[
            AnalyticsPoint(period=period, count=count)
            for period, count in counts.items()
        ],
    )

def compute_view_analytics(
    session: Session,
    user_id: int,
    start_date: date,
    end_date: date,
    group_by: AnalyticsGranularity,
) -> ViewAnalyticsResponse:
    
    start_datetime, end_datetime = _date_range(start_date, end_date)

    view_values = session.exec(
        select(JobViewLog.viewed_at, JobViewLog.job_id).where(
            JobViewLog.user_id == user_id,
            JobViewLog.viewed_at >= start_datetime,
            JobViewLog.viewed_at < end_datetime,
        )
    ).all()

    posting_ids_by_period = {period: set() for period in _periods_between(start_date, end_date, group_by)}
    for viewed_at, job_id in view_values:
        period = _period_start(viewed_at, group_by)
        if period in posting_ids_by_period:
            posting_ids_by_period[period].add(job_id)

    return ViewAnalyticsResponse(
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        points=[
            ViewAnalyticsPoint(period=period, unique_postings=len(job_ids))
            for period, job_ids in posting_ids_by_period.items()
        ],
    )

def compute_salary_distribution(
    session: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> SalaryDistributionResponse:
    
    start_datetime, end_datetime = _date_range(start_date, end_date)

    applied_jobs = session.exec(
        select(Job.salary_min, Job.salary_max)
        .join(Application, Application.job_id == Job.id)
        .where(
            Application.applicant_id == user_id,
            Application.applied_at >= start_datetime,
            Application.applied_at < end_datetime,
        )
    ).all()

    salary_values: list[float] = []
    for salary_min, salary_max in applied_jobs:
        if salary_min is None and salary_max is None:
            continue
        if salary_min is None:
            midpoint = salary_max
        elif salary_max is None:
            midpoint = salary_min
        else:
            midpoint = (salary_min + salary_max) / 2
        salary_values.append(float(midpoint))

    if not salary_values:
        return SalaryDistributionResponse(
            start_date=start_date,
            end_date=end_date,
            salary_count=0,
        )

    average_salary = sum(salary_values) / len(salary_values)
    variance = sum((salary - average_salary) ** 2 for salary in salary_values) / len(salary_values)

    return SalaryDistributionResponse(
        start_date=start_date,
        end_date=end_date,
        salary_count=len(salary_values),
        average_salary=average_salary,
        minimum_salary=min(salary_values),
        maximum_salary=max(salary_values),
        standard_deviation=sqrt(variance),
    )

def compute_application_summary(
    session: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> ApplicationSummaryResponse:
    
    start_datetime, end_datetime = _date_range(start_date, end_date)

    applied_jobs = session.exec(
        select(Job.category, Job.location)
        .join(Application, Application.job_id == Job.id)
        .where(
            Application.applicant_id == user_id,
            Application.applied_at >= start_datetime,
            Application.applied_at < end_datetime,
        )
    ).all()

    categories: dict[str, int] = {}
    locations: dict[str, int] = {}
    for category, location in applied_jobs:
        categories[category] = categories.get(category, 0) + 1
        locations[location] = locations.get(location, 0) + 1
    category, category_count = max(
        categories.items(), key=lambda item: (-item[1], item[0]), default=(None, 0)
    )
    location, location_count = max(
        locations.items(), key=lambda item: (-item[1], item[0]), default=(None, 0)
    )
    
    return ApplicationSummaryResponse(
        start_date=start_date,
        end_date=end_date,
        category=category,
        category_count=category_count,
        location=location,
        location_count=location_count,
    )
