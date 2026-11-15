from datetime import datetime, timedelta, timezone

from sqlmodel import select

from backend.models import Job, Notification, NotificationType, SavedJob
from backend.services.notification_service import generate_deadline_reminders
def _login(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email_address": user["email_address"], "password": user["password"]},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _saved_job(db_session, user_id, *, deadline, active=True):
    job = Job(
        recruiter_id=None,
        title="Deadline role",
        company_name="Acme",
        description="A role",
        location="Toronto",
        category="Engineering",
        is_active=active,
        deadline=deadline,
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    db_session.add(SavedJob(user_id=user_id, job_id=job.id))
    db_session.commit()
    return job


def test_deadline_reminder_is_generated_once_for_saved_job(db_session, test_user):
    now = datetime(2026, 6, 15, 12, tzinfo=timezone.utc)
    job = _saved_job(db_session, test_user["id"], deadline=now + timedelta(days=1))

    first = generate_deadline_reminders(db_session, test_user["id"], now=now)
    db_session.commit()
    second = generate_deadline_reminders(db_session, test_user["id"], now=now)

    assert len(first) == 1
    assert second == []
    reminder = db_session.exec(
        select(Notification).where(Notification.reference_id == job.id)
    ).one()
    assert reminder.notification_type == NotificationType.DEADLINE_REMINDER
    assert reminder.reference_type == "job_deadline"


def test_deadline_boundaries_include_due_and_skip_overdue_or_far_future(db_session, test_user):
    now = datetime(2026, 6, 15, 12, tzinfo=timezone.utc)
    due = _saved_job(db_session, test_user["id"], deadline=now)
    _saved_job(db_session, test_user["id"], deadline=now - timedelta(seconds=1))
    _saved_job(db_session, test_user["id"], deadline=now + timedelta(days=3, seconds=1))

    reminders = generate_deadline_reminders(db_session, test_user["id"], now=now)

    assert [item.reference_id for item in reminders] == [due.id]


def test_notification_refresh_checks_saved_job_deadlines(client, test_user, db_session):
    now = datetime.now(timezone.utc)
    job = _saved_job(db_session, test_user["id"], deadline=now + timedelta(hours=1))
    headers = _login(client, test_user)

    save_response = client.post(f"/api/jobs/{job.id}/save", headers=headers)
    assert save_response.status_code == 201
    first = client.get("/api/notifications", headers=headers)
    second = client.get("/api/notifications", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    deadline_notifications = [
        item for item in second.json()["notifications"]
        if item["notification_type"] == NotificationType.DEADLINE_REMINDER.value
    ]
    assert len(deadline_notifications) == 1


def test_job_api_normalizes_offset_deadline_before_reminder_check(
    client, test_user, recruiter_user, db_session
):
    headers = _login(client, recruiter_user)
    response = client.post(
        "/api/jobs",
        headers=headers,
        json={
            "title": "Offset role",
            "company_name": "Acme",
            "description": "A role",
            "location": "Toronto",
            "category": "Engineering",
            "deadline": "2026-06-15T13:00:00-04:00",
        },
    )
    assert response.status_code == 201

    job = db_session.get(Job, response.json()["id"])
    db_session.add(SavedJob(user_id=test_user["id"], job_id=job.id))
    db_session.commit()
    reminders = generate_deadline_reminders(
        db_session,
        test_user["id"],
        now=datetime(2026, 6, 15, 12, tzinfo=timezone.utc),
    )

    assert len(reminders) == 1
