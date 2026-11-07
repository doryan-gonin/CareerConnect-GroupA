from datetime import datetime, timezone
from sqlmodel import Session
from backend.models import (
    Notification,
    NotificationType,
    Application,
    Job,
    ApplicationStatus,
)

def create_notification(
    session: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.STATUS_UPDATE,
    reference_id: int | None = None,
    reference_type: str | None = None,
 ) -> Notification:
    """Create a new notification for a specific user."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
        created_at=datetime.now(timezone.utc),
        reference_id=reference_id,
        reference_type=reference_type,
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
    if old_status == new_status:
        return None

    job_title = job.title if job else "your applied position" # Shouldn't happen
    company_name = job.company_name if job else "the company" 

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

    return create_notification(
        session=session,
        user_id=application.applicant_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_id=application.id,
        reference_type="application",
    )

