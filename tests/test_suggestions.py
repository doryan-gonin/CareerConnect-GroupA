"""Acceptance tests for the cached AI suggested postings flow."""

from sqlmodel import select

from backend.models import JobSuggestion, User
from backend.services import suggestion_service


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


def test_provider_suggestions_keeps_only_valid_rows(monkeypatch, test_jobs):
    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"suggestions": ['
                                '{"job_id": %d, "score": 1.4, "justification": "Strong match"},'
                                '{"job_id": 99999, "score": 0.5, "justification": "Unknown"},'
                                '{"job_id": %d, "score": 0.5, "justification": ""}'
                                ']}\n'
                            )
                            % (test_jobs[0].id, test_jobs[1].id)
                        }
                    }
                ]
            }

    monkeypatch.setattr(suggestion_service, "AI_MOCK_MODE", False)
    monkeypatch.setattr(suggestion_service, "AI_API_KEY", "test-key")
    monkeypatch.setattr(suggestion_service, "AI_API_BASE_URL", "https://api.example.com/v1")
    monkeypatch.setattr(suggestion_service, "AI_MODEL", "test-model")
    monkeypatch.setattr(suggestion_service.httpx, "post", lambda *args, **kwargs: Response())

    suggestions = suggestion_service._provider_suggestions({}, test_jobs)
    assert suggestions == [
        {"job_id": test_jobs[0].id, "score": 1.0, "justification": "Strong match"}
    ]


def test_provider_suggestions_falls_back_on_provider_errors(monkeypatch, test_jobs):
    monkeypatch.setattr(suggestion_service, "AI_MOCK_MODE", False)
    monkeypatch.setattr(suggestion_service, "AI_API_KEY", "test-key")
    monkeypatch.setattr(suggestion_service, "AI_API_BASE_URL", "https://api.example.com/v1")
    monkeypatch.setattr(suggestion_service, "AI_MODEL", "test-model")

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": "not json"}}]}

    monkeypatch.setattr(suggestion_service.httpx, "post", lambda *args, **kwargs: Response())
    assert suggestion_service._provider_suggestions({}, test_jobs) is None


def test_deterministic_suggestions_use_candidate_preferences(test_jobs):
    test_jobs[0].description = "Build Python services"
    candidate = {
        "skills": ["python"],
        "salary_min": 50000,
        "locations": ["Location 1"],
        "typical_hours_per_week": 40,
    }
    suggestions = suggestion_service._deterministic(candidate, test_jobs[:1])
    assert suggestions[0]["score"] == 0.74
    assert "resume skills" in suggestions[0]["justification"]
    assert "salary preference" in suggestions[0]["justification"]
    assert "location" in suggestions[0]["justification"]
    assert "weekly hours" in suggestions[0]["justification"]


def test_provider_suggestions_rejects_malformed_rows(monkeypatch, test_jobs):
    monkeypatch.setattr(suggestion_service, "AI_MOCK_MODE", False)
    monkeypatch.setattr(suggestion_service, "AI_API_KEY", "test-key")
    monkeypatch.setattr(suggestion_service, "AI_API_BASE_URL", "https://api.example.com/v1")
    monkeypatch.setattr(suggestion_service, "AI_MODEL", "test-model")

    class Response:
        def __init__(self, content):
            self.content = content

        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": self.content}}]}

    monkeypatch.setattr(
        suggestion_service.httpx,
        "post",
        lambda *args, **kwargs: Response('{"suggestions": "not-a-list"}'),
    )
    assert suggestion_service._provider_suggestions({}, test_jobs) is None

    monkeypatch.setattr(
        suggestion_service.httpx,
        "post",
        lambda *args, **kwargs: Response(
            '{"suggestions": [{"job_id": %d, "score": "bad", "justification": "ok"}]}'
            % test_jobs[0].id
        ),
    )
    assert suggestion_service._provider_suggestions({}, test_jobs) is None


def test_cached_suggestions_refresh_flag_rebuilds_rows(db_session, test_user, test_jobs):
    user = db_session.get(User, test_user["id"])
    cached = suggestion_service.get_cached_suggestions(db_session, user, refresh=True)
    assert set(cached) == {job.id for job in test_jobs}
