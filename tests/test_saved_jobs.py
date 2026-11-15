from sqlmodel import select

from backend.models import SavedJob


def _login(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email_address": user["email_address"], "password": user["password"]},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_saved_jobs_are_private_and_idempotent(
    client, db_session, test_user, second_user, test_jobs
):
    first_headers = _login(client, test_user)
    second_headers = _login(client, second_user)
    job = test_jobs[0]

    first = client.post(f"/api/jobs/{job.id}/save", headers=first_headers)
    duplicate = client.post(f"/api/jobs/{job.id}/save", headers=first_headers)

    assert first.status_code == 201
    assert duplicate.status_code == 201
    assert duplicate.json()["id"] == first.json()["id"]
    assert len(
        db_session.exec(
            select(SavedJob).where(
                SavedJob.user_id == test_user["id"], SavedJob.job_id == job.id
            )
        ).all()
    ) == 1

    assert client.get("/api/jobs/saved", headers=first_headers).json()[0]["job_id"] == job.id
    assert client.get("/api/jobs/saved", headers=second_headers).json() == []


def test_unsave_is_idempotent_and_does_not_affect_other_users(
    client, db_session, test_user, second_user, test_jobs
):
    first_headers = _login(client, test_user)
    second_headers = _login(client, second_user)
    job = test_jobs[0]

    client.post(f"/api/jobs/{job.id}/save", headers=first_headers)
    client.post(f"/api/jobs/{job.id}/save", headers=second_headers)

    assert client.delete(f"/api/jobs/{job.id}/save", headers=first_headers).status_code == 204
    assert client.delete(f"/api/jobs/{job.id}/save", headers=first_headers).status_code == 204
    assert client.get("/api/jobs/saved", headers=second_headers).json()[0]["job_id"] == job.id


def test_inactive_bookmarks_are_visible_but_cannot_be_created(
    client, db_session, test_user, inactive_job, test_jobs
):
    headers = _login(client, test_user)
    denied = client.post(f"/api/jobs/{inactive_job.id}/save", headers=headers)
    assert denied.status_code == 404

    db_session.add(SavedJob(user_id=test_user["id"], job_id=inactive_job.id))
    db_session.commit()

    saved = client.get("/api/jobs/saved", headers=headers)
    assert saved.status_code == 200
    inactive = next(item for item in saved.json() if item["job_id"] == inactive_job.id)
    assert inactive["job"]["is_active"] is False


def test_saved_job_endpoints_require_candidate_auth(client, recruiter_user, test_jobs):
    recruiter_headers = _login(client, recruiter_user)
    job = test_jobs[0]

    assert client.get("/api/jobs/saved", headers=recruiter_headers).status_code == 403
    assert client.post(f"/api/jobs/{job.id}/save", headers=recruiter_headers).status_code == 403
    assert client.delete(f"/api/jobs/{job.id}/save", headers=recruiter_headers).status_code == 403

