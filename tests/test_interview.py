import pytest

from backend.models import Job, JobSchedule, JobType
from backend.services import interview_service
from backend.services.interview_service import build_system_prompt

OFF_TOPIC_RULE = "If the user asks about anything unrelated to preparing for this interview"
DECLINE_RULE = "politely decline"


class FakeProviderResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"choices": [{"message": {"content": "AI reply"}}]}


@pytest.fixture
def ai_requests(monkeypatch):
    """Replaces the AI provider and records every payload the backend would have sent."""
    payloads = []

    def fake_post(url, json, headers, timeout):
        payloads.append(json)
        return FakeProviderResponse()

    monkeypatch.setattr(interview_service, "AI_API_KEY", "test-key")
    monkeypatch.setattr(interview_service.httpx, "post", fake_post)
    return payloads


@pytest.fixture
def applicant_headers(client, candidate_application):
    applicant = candidate_application["applicant"]
    response = client.post(
        "/api/auth/login",
        json={"email_address": applicant["email_address"], "password": applicant["password"]},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def interview_session(client, candidate_application, applicant_headers, ai_requests):
    response = client.post(
        "/api/interview/sessions",
        json={"application_id": candidate_application["application_id"]},
        headers=applicant_headers,
    )
    assert response.status_code == 201
    return response.json()


def make_job(title, company, description):
    return Job(
        title=title,
        company_name=company,
        description=description,
        location="Montreal",
        category="Engineering",
        job_type=JobType.PERMANENT,
        job_schedule=JobSchedule.FULL_TIME,
    )


def system_prompt_of(payload):
    assert payload["messages"][0]["role"] == "system"
    return payload["messages"][0]["content"]


class TestPromptGeneration:
    def test_prompt_contains_posting_details(self):
        job = make_job("Data Analyst", "Acme", "Build sales dashboards.")
        prompt = build_system_prompt(job, "")

        for expected in ["Data Analyst", "Acme", "Build sales dashboards.", "Montreal", "Engineering"]:
            assert expected in prompt

    def test_prompts_differ_by_posting(self):
        first = build_system_prompt(make_job("Data Analyst", "Acme", "Dashboards."), "")
        second = build_system_prompt(make_job("Line Cook", "Bistro", "Prepare meals."), "")

        assert "Data Analyst" in first and "Line Cook" not in first
        assert "Line Cook" in second and "Data Analyst" not in second

    def test_prompt_includes_resume_text(self):
        job = make_job("Data Analyst", "Acme", "Dashboards.")
        assert "Skills: SQL, Tableau" in build_system_prompt(job, "Skills: SQL, Tableau")

    def test_prompt_without_resume_says_so(self):
        job = make_job("Data Analyst", "Acme", "Dashboards.")
        assert "has not provided a resume" in build_system_prompt(job, "")

    def test_prompt_tells_model_to_decline_off_topic(self):
        prompt = build_system_prompt(make_job("Data Analyst", "Acme", "Dashboards."), "")
        assert OFF_TOPIC_RULE in prompt
        assert DECLINE_RULE in prompt


class TestContextPassing:
    def test_new_session_uses_the_applications_posting(self, interview_session, ai_requests):
        prompt = system_prompt_of(ai_requests[0])

        assert "Job Title 1" in prompt
        assert "Description for job 1" in prompt
        assert "Job Title 2" not in prompt

    def test_further_discussion_keeps_posting_and_off_topic_rule(
        self, client, interview_session, applicant_headers, ai_requests
    ):
        response = client.post(
            f"/api/interview/sessions/{interview_session['id']}/messages",
            json={"content": "Who won the World Cup?"},
            headers=applicant_headers,
        )
        assert response.status_code == 200

        prompt = system_prompt_of(ai_requests[-1])
        assert "Job Title 1" in prompt
        assert OFF_TOPIC_RULE in prompt
        assert DECLINE_RULE in prompt

    def test_every_later_turn_resends_the_off_topic_rule(
        self, client, interview_session, applicant_headers, ai_requests
    ):
        for content in ["First question", "Second question", "Third question"]:
            client.post(
                f"/api/interview/sessions/{interview_session['id']}/messages",
                json={"content": content},
                headers=applicant_headers,
            )

        assert len(ai_requests) == 4
        for payload in ai_requests:
            assert OFF_TOPIC_RULE in system_prompt_of(payload)

    def test_further_discussion_passes_conversation_in_order(
        self, client, interview_session, applicant_headers, ai_requests
    ):
        url = f"/api/interview/sessions/{interview_session['id']}/messages"
        client.post(url, json={"content": "First question"}, headers=applicant_headers)
        client.post(url, json={"content": "Second question"}, headers=applicant_headers)

        assert ai_requests[-1]["messages"][1:] == [
            {"role": "assistant", "content": "AI reply"},
            {"role": "user", "content": "First question"},
            {"role": "assistant", "content": "AI reply"},
            {"role": "user", "content": "Second question"},
        ]


class TestProviderFailureHandling:
    def test_provider_non_json_response_returns_502(
        self, client, candidate_application, applicant_headers, monkeypatch
    ):
        class NonJsonResponse:
            def raise_for_status(self):
                pass

            def json(self):
                raise ValueError("No JSON object could be decoded")

        monkeypatch.setattr(interview_service, "AI_API_KEY", "test-key")
        monkeypatch.setattr(interview_service.httpx, "post", lambda *args, **kwargs: NonJsonResponse())

        response = client.post(
            "/api/interview/sessions",
            json={"application_id": candidate_application["application_id"]},
            headers=applicant_headers,
        )
        assert response.status_code == 502
        assert "non-JSON or malformed" in response.json()["detail"]

    def test_provider_empty_choices_returns_502(
        self, client, candidate_application, applicant_headers, monkeypatch
    ):
        class EmptyChoicesResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {"choices": []}

        monkeypatch.setattr(interview_service, "AI_API_KEY", "test-key")
        monkeypatch.setattr(interview_service.httpx, "post", lambda *args, **kwargs: EmptyChoicesResponse())

        response = client.post(
            "/api/interview/sessions",
            json={"application_id": candidate_application["application_id"]},
            headers=applicant_headers,
        )
        assert response.status_code == 502
        assert "missing choices" in response.json()["detail"]

    def test_provider_missing_message_returns_502(
        self, client, candidate_application, applicant_headers, monkeypatch
    ):
        class MissingMessageResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {"choices": [{}]}

        monkeypatch.setattr(interview_service, "AI_API_KEY", "test-key")
        monkeypatch.setattr(interview_service.httpx, "post", lambda *args, **kwargs: MissingMessageResponse())

        response = client.post(
            "/api/interview/sessions",
            json={"application_id": candidate_application["application_id"]},
            headers=applicant_headers,
        )
        assert response.status_code == 502
        assert "malformed or missing" in response.json()["detail"]

    def test_provider_empty_content_returns_502(
        self, client, candidate_application, applicant_headers, monkeypatch
    ):
        class EmptyContentResponse:
            def raise_for_status(self):
                pass

            def json(self):
                return {"choices": [{"message": {"content": "   "}}]}

        monkeypatch.setattr(interview_service, "AI_API_KEY", "test-key")
        monkeypatch.setattr(interview_service.httpx, "post", lambda *args, **kwargs: EmptyContentResponse())

        response = client.post(
            "/api/interview/sessions",
            json={"application_id": candidate_application["application_id"]},
            headers=applicant_headers,
        )
        assert response.status_code == 502
        assert "empty response" in response.json()["detail"]

    def test_provider_http_error_returns_502(
        self, client, candidate_application, applicant_headers, monkeypatch
    ):
        def fake_post_error(*args, **kwargs):
            raise interview_service.httpx.ConnectError("Connection refused")

        monkeypatch.setattr(interview_service, "AI_API_KEY", "test-key")
        monkeypatch.setattr(interview_service.httpx, "post", fake_post_error)

        response = client.post(
            "/api/interview/sessions",
            json={"application_id": candidate_application["application_id"]},
            headers=applicant_headers,
        )
        assert response.status_code == 502
        assert "Could not reach the AI provider" in response.json()["detail"]

