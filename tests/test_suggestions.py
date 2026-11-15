"""Acceptance tests for the cached AI suggested postings flow."""

from sqlmodel import select

from backend.models import JobSuggestion


def _token(client, user):
    response = client.post("/api/auth/login", json={"email_address": user["email_address"], "password": user["password"]})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_login_warms_cache_and_ai_filter_includes_explanation(client, test_user, test_jobs):
    token = _token(client, test_user)
    response = client.get("/api/jobs", params={"ai_suggested": "true"}, headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == len(test_jobs)
    assert all(job["ai_suggested"] for job in payload["jobs"])
    assert all(job["suggestion_justification"] for job in payload["jobs"])


def test_refresh_endpoint_requires_applicant_and_replaces_cache(client, test_user, test_jobs, db_session):
    token = _token(client, test_user)
    response = client.post("/api/jobs/suggestions/refresh", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["count"] == len(test_jobs)
    rows = db_session.exec(select(JobSuggestion).where(JobSuggestion.user_id == test_user["id"])).all()
    assert len(rows) == len(test_jobs)


def test_ai_filter_requires_authentication(client, test_jobs):
    response = client.get("/api/jobs", params={"ai_suggested": "true"})
    assert response.status_code == 401
