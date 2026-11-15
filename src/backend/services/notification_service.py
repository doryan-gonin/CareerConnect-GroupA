from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from backend.models import (
    Notification,
    NotificationType,
    Application,
    Job,
    ApplicationStatus,
    SavedJob,
    User,
)

DEADLINE_REMINDER_WINDOW = timedelta(days=3)


def _as_utc(value: datetime) -> datetime:
    """Normalize aware and legacy-naive timestamps to UTC for comparisons."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

def create_notification(
    session: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.STATUS_UPDATE,
    reference_id: int | None = None,
    reference_type: str | None = None,
    dedupe_key: str | None = None,
 ) -> Notification:
    """Create a notification, reusing an existing keyed event when present.

    Trigger handlers may be retried after a network timeout.  A stable key
    makes those retries safe while the unique database index handles races
    between workers.  Unkeyed notifications retain the historical behavior.
    """
    if dedupe_key:
        existing = session.exec(
            select(Notification).where(Notification.dedupe_key == dedupe_key)
        ).first()
        if existing is not None:
            return existing

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
        created_at=datetime.now(timezone.utc),
        reference_id=reference_id,
        reference_type=reference_type,
        dedupe_key=dedupe_key,
    )
    session.add(notification)
    return notification


def notify_status_change(
    session: Session,
    application: Application,
    job: Job,
    old_status: ApplicationStatus,
    new_status: ApplicationStatus,
 ) -> Notification | None:
    """
    Generate a notification when an application status updates.
    Sends an INTERVIEW_INVITATION if invited to interview,
    or a generic STATUS_UPDATE otherwise.
    """
    if (
        old_status == new_status
        or application is None
        or job is None
        or application.id is None
        or application.job_id != job.id
        or application.applicant_id is None
    ):
        return None

    applicant = session.get(User, application.applicant_id)
    if applicant is None or applicant.is_recruiter:
        return None

    job_title = job.title
    company_name = job.company_name

    if new_status == ApplicationStatus.INTERVIEW:
        notification_type = NotificationType.INTERVIEW_INVITATION
        title = f"Interview Invitation: {job_title}"
        message = (
            f"Congratulations! You have been invited for an interview for the {job_title} "
            f"position at {company_name}."
        )
        
    else:
        notification_type = NotificationType.STATUS_UPDATE
        title = f"Application Update: {job_title}"
        message = (
            f"Your application status for {job_title} at {company_name} "
            f"has been updated to '{new_status.value}'."
        )

    dedupe_key = (
        f"application-status:{application.id}:{new_status.value}"
        if application.id is not None
        else None
    )
    return create_notification(
        session=session,
        user_id=application.applicant_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_id=application.id,
        reference_type="application",
        dedupe_key=dedupe_key,
    )


def generate_deadline_reminders(
    session: Session,
    user_id: int,
    *,
    now: datetime | None = None,
    reminder_window: timedelta = DEADLINE_REMINDER_WINDOW,
) -> list[Notification]:
    """Create one reminder for each saved job whose deadline is approaching.

    The check is intentionally safe to invoke repeatedly (for example when a
    user opens their notification panel or a scheduler calls the endpoint).
    Deadlines at the current instant are included; deadlines already in the
    past are excluded so an overdue posting cannot generate a reminder on every
    request.  The UTC deadline is part of the dedupe key, allowing a recruiter
    to move a deadline and receive a new reminder for the new date.

    The caller owns the transaction and should commit after this function
    returns.  ``Notification.dedupe_key`` provides a database-level backstop
    against duplicate writes from concurrent workers.
    """
    current = _as_utc(now or datetime.now(timezone.utc))
    upper_bound = current + reminder_window
    saved_jobs = session.exec(
        select(SavedJob, Job)
        .join(Job, SavedJob.job_id == Job.id)
        .where(SavedJob.user_id == user_id, Job.is_active)
    ).all()

    reminders: list[Notification] = []
    for saved_job, job in saved_jobs:
        if job.deadline is None:
            continue
        deadline = _as_utc(job.deadline)
        if deadline < current or deadline > upper_bound:
            continue

        deadline_key = deadline.isoformat()
        dedupe_key = f"deadline-reminder:{user_id}:{job.id}:{deadline_key}"
        existing = session.exec(
            select(Notification.id).where(Notification.dedupe_key == dedupe_key)
        ).first()
        if existing is not None:
            continue

        title = f"Upcoming deadline: {job.title}"
        message = (
            f"The application deadline for {job.title} at {job.company_name} "
            f"is {deadline.strftime('%Y-%m-%d %H:%M UTC')}."
        )
        try:
            # A savepoint converts a concurrent insert racing this check into
            # a harmless no-op while preserving the caller's transaction.
            with session.begin_nested():
                reminder = create_notification(
                    session=session,
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=NotificationType.DEADLINE_REMINDER,
                    reference_id=job.id,
                    reference_type="job_deadline",
                    dedupe_key=dedupe_key,
                )
                session.flush()
            reminders.append(reminder)
        except IntegrityError:
            # Another worker created the same keyed reminder first.
            continue

    return reminders

# Only used for recruiter accounts (flag set in "users" DB)
def notify_new_application_received(
    session: Session,
    job: Job,
    application: Application,
    applicant: User,
) -> Notification | None:
    """
    Generate a notification for a recruiter when a new candidate applies to their job posting.
    """
    if (
        not job.recruiter_id
        or not applicant
        or applicant.id != application.applicant_id
        or job.id != application.job_id
        or job.recruiter_id == applicant.id
    ):
        return None

    # The job owner is the notification recipient.  Job creation is already
    # restricted to recruiter accounts; relying on ownership also keeps legacy
    # rows (created before the role flag existed) working safely.
    recruiter = session.get(User, job.recruiter_id)
    if recruiter is None:
        return None

    job_title = job.title if job.title else "your job posting"
    return create_notification(
        session=session,
        user_id=job.recruiter_id,
        title=f"New Application: {job_title}",
        message=f"A new candidate has submitted an application for '{job_title}'.",
        notification_type=NotificationType.APPLICATION_RECEIVED,
        reference_id=application.id,
        reference_type="application",
        dedupe_key=(
            f"application-received:{application.id}:{job.recruiter_id}"
            if application.id is not None
            else None
        ),
    )


