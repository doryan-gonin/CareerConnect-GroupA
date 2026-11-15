"""Coverage for recruiter-only job management and applicant review routes."""

from sqlmodel import select

from backend.models import Application, JobViewLog, Resume


def _headers(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email_address": user["email_address"], "password": user["password"]},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _other_recruiter_headers(client):
    registration = client.post(
        "/api/auth/register",
        json={
            "email_address": "different-recruiter@example.com",
            "password": "Recruiter@123",
            "is_recruiter": True,
        },
    )
    assert registration.status_code == 201
    return _headers(
        client,
        {"email_address": "different-recruiter@example.com", "password": "Recruiter@123"},
    )


def test_recruiter_can_review_applications_and_resume(
    client, candidate_application, db_session, tmp_path
):
    recruiter = candidate_application["recruiter"]
    applicant = candidate_application["applicant"]
    job_id = candidate_application["job_id"]
    application_id = candidate_application["application_id"]
    recruiter_headers = _headers(client, recruiter)
    applicant_headers = _headers(client, applicant)
    other_recruiter_headers = _other_recruiter_headers(client)

    listing = client.get(f"/api/jobs/{job_id}/applications", headers=recruiter_headers)
    assert listing.status_code == 200
    assert listing.json()[0]["id"] == application_id
    assert listing.json()[0]["applicant_email"] == applicant["email_address"]

    assert client.get(
        f"/api/jobs/{job_id}/applications", headers=applicant_headers
    ).status_code == 403
    assert client.get(
        f"/api/jobs/{job_id}/applications", headers=other_recruiter_headers
    ).status_code == 403
    assert client.get("/api/jobs/99999/applications", headers=recruiter_headers).status_code == 404

    resume_path = tmp_path / "applicant_resume.pdf"
    resume_path.write_bytes(b"%PDF-1.4 test resume")
    application = db_session.get(Application, application_id)
    resume = db_session.get(Resume, application.resume_id)
    # The fixture stores a fixed path; point that same resume at a temporary file.
    assert resume is not None
    resume.file_path = str(resume_path)
    db_session.add(resume)
    db_session.commit()

    download = client.get(
        f"/api/jobs/{job_id}/applications/{application_id}/resume",
        headers=recruiter_headers,
    )
    assert download.status_code == 200
    assert download.content.startswith(b"%PDF")

    assert client.get(
        f"/api/jobs/{job_id}/applications/99999/resume", headers=recruiter_headers
    ).status_code == 404
    assert client.get(
        "/api/jobs/99999/applications/99999/resume", headers=recruiter_headers
    ).status_code == 404
    assert client.get(
        f"/api/jobs/{job_id}/applications/{application_id}/resume",
        headers=other_recruiter_headers,
    ).status_code == 403


def test_recruiter_job_update_delete_and_view_deduplication(
    client, recruiter_user, second_user, db_session
):
    recruiter_headers = _headers(client, recruiter_user)
    applicant_headers = _headers(client, second_user)
    other_recruiter_headers = _other_recruiter_headers(client)
    created = client.post(
        "/api/jobs",
        json={
            "title": "Recruiter role",
            "company_name": "Acme",
            "description": "Build APIs",
            "location": "Toronto",
            "category": "Engineering",
            "job_type": "Permanent",
            "job_schedule": "Full-time",
        },
        headers=recruiter_headers,
    )
    assert created.status_code == 201
    job_id = created.json()["id"]

    updated = client.put(
        f"/api/jobs/{job_id}",
        json={
            "title": "Updated title",
            "salary_min": 60000,
            "deadline": "2026-06-20T12:00:00-04:00",
        },
        headers=recruiter_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated title"

    forbidden = client.put(
        f"/api/jobs/{job_id}",
        json={"title": "Nope"},
        headers=other_recruiter_headers,
    )
    assert forbidden.status_code == 403
    assert client.put(
        "/api/jobs/99999", json={"title": "Missing"}, headers=recruiter_headers
    ).status_code == 404

    assert client.get(f"/api/jobs/{job_id}", headers=applicant_headers).status_code == 200
    assert client.get(f"/api/jobs/{job_id}", headers=applicant_headers).status_code == 200
    views = db_session.exec(
        select(JobViewLog).where(JobViewLog.user_id == second_user["id"], JobViewLog.job_id == job_id)
    ).all()
    assert len(views) == 1

    deleted = client.delete(f"/api/jobs/{job_id}", headers=recruiter_headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/jobs/{job_id}").status_code == 404
    assert client.delete("/api/jobs/99999", headers=recruiter_headers).status_code == 404
    assert client.delete(f"/api/jobs/{job_id}", headers=other_recruiter_headers).status_code == 403


def test_record_view_and_apply_validation(client, recruiter_user, second_user, db_session):
    recruiter_headers = _headers(client, recruiter_user)
    applicant_headers = _headers(client, second_user)
    created = client.post(
        "/api/jobs",
        json={
            "title": "Validation role",
            "company_name": "Acme",
            "description": "Build APIs",
            "location": "Toronto",
            "category": "Engineering",
            "job_type": "Permanent",
            "job_schedule": "Full-time",
        },
        headers=recruiter_headers,
    )
    assert created.status_code == 201
    job_id = created.json()["id"]

    assert client.post(f"/api/jobs/{job_id}/view", headers=applicant_headers).status_code == 204
    assert client.post(f"/api/jobs/{job_id}/view", headers=applicant_headers).status_code == 204
    assert client.post("/api/jobs/99999/view", headers=applicant_headers).status_code == 404

    no_resume = client.post(f"/api/jobs/{job_id}/apply", headers=applicant_headers)
    assert no_resume.status_code == 400
    assert client.post("/api/jobs/99999/apply", headers=applicant_headers).status_code == 404

    upload = client.post(
        "/api/profiles/me/resumes",
        files={"file": ("candidate.pdf", b"%PDF-1.4 candidate", "application/pdf")},
        headers=applicant_headers,
    )
    assert upload.status_code == 201
    resume_id = upload.json()["id"]

    invalid_resume = client.post(
        f"/api/jobs/{job_id}/apply",
        json={"resume_id": 99999},
        headers=applicant_headers,
    )
    assert invalid_resume.status_code == 404

    applied = client.post(
        f"/api/jobs/{job_id}/apply",
        json={"resume_id": resume_id},
        headers=applicant_headers,
    )
    assert applied.status_code == 201
    duplicate = client.post(
        f"/api/jobs/{job_id}/apply",
        json={"resume_id": resume_id},
        headers=applicant_headers,
    )
    assert duplicate.status_code == 409

