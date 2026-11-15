"""Coverage for the candidate and recruiter application endpoints."""

from backend.models import Application, ApplicationStatus


def _headers(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email_address": user["email_address"], "password": user["password"]},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_applicant_can_list_and_view_application(client, candidate_application):
    applicant = candidate_application["applicant"]
    application_id = candidate_application["application_id"]
    headers = _headers(client, applicant)

    listed = client.get("/api/applications/me", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == application_id
    assert listed.json()[0]["job_title"] == "Job Title 1"

    detail = client.get(f"/api/applications/{application_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["resume_name"] == "applicant_resume.pdf"


def test_application_status_filter_and_withdrawal(client, candidate_application):
    applicant = candidate_application["applicant"]
    application_id = candidate_application["application_id"]
    headers = _headers(client, applicant)

    filtered = client.get(
        "/api/applications/me",
        params={"status": ApplicationStatus.APPLIED.value},
        headers=headers,
    )
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1

    withdrawn = client.delete(f"/api/applications/{application_id}", headers=headers)
    assert withdrawn.status_code == 200
    assert client.get("/api/applications/me", headers=headers).json() == []


def test_application_permissions_for_recruiter_and_other_applicant(
    client, candidate_application, test_user
):
    recruiter_headers = _headers(client, candidate_application["recruiter"])
    other_headers = _headers(client, test_user)
    application_id = candidate_application["application_id"]

    recruiter_detail = client.get(
        f"/api/applications/{application_id}", headers=recruiter_headers
    )
    assert recruiter_detail.status_code == 200

    forbidden_withdrawal = client.delete(
        f"/api/applications/{application_id}", headers=recruiter_headers
    )
    assert forbidden_withdrawal.status_code == 403
    forbidden_other_withdrawal = client.delete(
        f"/api/applications/{application_id}", headers=other_headers
    )
    assert forbidden_other_withdrawal.status_code == 403

    forbidden_detail = client.get(
        f"/api/applications/{application_id}", headers=other_headers
    )
    assert forbidden_detail.status_code == 403


def test_recruiter_can_update_application_status_and_only_owner_can_do_so(
    client, candidate_application, test_user
):
    recruiter_headers = _headers(client, candidate_application["recruiter"])
    other_headers = _headers(client, test_user)
    application_id = candidate_application["application_id"]

    updated = client.patch(
        f"/api/applications/{application_id}/status",
        json={"status": ApplicationStatus.INTERVIEW.value},
        headers=recruiter_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == ApplicationStatus.INTERVIEW.value

    forbidden = client.patch(
        f"/api/applications/{application_id}/status",
        json={"status": ApplicationStatus.REJECTED.value},
        headers=other_headers,
    )
    assert forbidden.status_code == 403

    missing = client.patch(
        "/api/applications/99999/status",
        json={"status": ApplicationStatus.REJECTED.value},
        headers=recruiter_headers,
    )
    assert missing.status_code == 404


def test_application_missing_and_orphaned_job_errors(client, candidate_application, db_session):
    applicant_headers = _headers(client, candidate_application["applicant"])

    assert client.get("/api/applications/99999", headers=applicant_headers).status_code == 404
    assert client.delete("/api/applications/99999", headers=applicant_headers).status_code == 404

    orphan = Application(
        job_id=99999,
        applicant_id=candidate_application["applicant"]["id"],
        status=ApplicationStatus.APPLIED,
    )
    db_session.add(orphan)
    db_session.commit()
    db_session.refresh(orphan)

    response = client.get(f"/api/applications/{orphan.id}", headers=applicant_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Associated job posting not found."


def test_status_update_rejects_non_owner_recruiter(client, candidate_application):
    registration = client.post(
        "/api/auth/register",
        json={
            "email_address": "other-recruiter@example.com",
            "password": "Recruiter@123",
            "is_recruiter": True,
        },
    )
    assert registration.status_code == 201
    headers = _headers(
        client,
        {"email_address": "other-recruiter@example.com", "password": "Recruiter@123"},
    )
    response = client.patch(
        f"/api/applications/{candidate_application['application_id']}/status",
        json={"status": ApplicationStatus.REJECTED.value},
        headers=headers,
    )
    assert response.status_code == 403
