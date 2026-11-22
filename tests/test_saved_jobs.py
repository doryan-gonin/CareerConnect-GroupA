import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from backend.models import Job, SavedJob, User


# Helper function
def auth_headers(client, user) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"email_address": user["email_address"], "password": user["password"]},
    )
    assert response.status_code == 200, f"Login failed: {response.json()}"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


# ==============================================================================
# Saving jobs
# ==============================================================================
class TestSaveJob:
    def test_save_job_success(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job = test_jobs[0]

        response = client.post(f"/api/saved-jobs/{job.id}", headers=headers)

        assert response.status_code == 201
        data = response.json()
        assert data["job_id"] == job.id
        assert data["job"]["title"] == job.title
        assert "saved_at" in data

    def test_save_job_persists_link_to_user(self, client, db_session, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        client.post(f"/api/saved-jobs/{test_jobs[1].id}", headers=headers)

        rows = db_session.exec(select(SavedJob).where(SavedJob.user_id == test_user["id"])).all()
        assert [row.job_id for row in rows] == [test_jobs[1].id]

    def test_save_job_twice_conflict(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job_id = test_jobs[0].id

        assert client.post(f"/api/saved-jobs/{job_id}", headers=headers).status_code == 201
        response = client.post(f"/api/saved-jobs/{job_id}", headers=headers)

        assert response.status_code == 409

    def test_save_nonexistent_job(self, client, test_user):
        headers = auth_headers(client, test_user)
        response = client.post("/api/saved-jobs/99999", headers=headers)
        assert response.status_code == 404

    def test_save_inactive_job(self, client, test_user, inactive_job):
        headers = auth_headers(client, test_user)
        response = client.post(f"/api/saved-jobs/{inactive_job.id}", headers=headers)
        assert response.status_code == 404

    def test_save_job_requires_auth(self, client, test_jobs):
        response = client.post(f"/api/saved-jobs/{test_jobs[0].id}")
        assert response.status_code in (401, 403)

    def test_recruiter_cannot_save_job(self, client, recruiter_user, test_jobs):
        headers = auth_headers(client, recruiter_user)
        response = client.post(f"/api/saved-jobs/{test_jobs[0].id}", headers=headers)
        assert response.status_code == 403


# ==============================================================================
# Listing saved jobs
# ==============================================================================
class TestListSavedJobs:
    def test_list_empty(self, client, test_user):
        headers = auth_headers(client, test_user)
        response = client.get("/api/saved-jobs", headers=headers)

        assert response.status_code == 200
        assert response.json() == {"total": 0, "saved_jobs": []}

    def test_list_returns_saved_jobs_newest_first(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        for job in test_jobs[:3]:
            client.post(f"/api/saved-jobs/{job.id}", headers=headers)

        response = client.get("/api/saved-jobs", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert [item["job_id"] for item in data["saved_jobs"]] == [
            test_jobs[2].id,
            test_jobs[1].id,
            test_jobs[0].id,
        ]
        assert data["saved_jobs"][0]["job"]["company_name"] == test_jobs[2].company_name

    def test_list_saved_job_ids(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        client.post(f"/api/saved-jobs/{test_jobs[0].id}", headers=headers)
        client.post(f"/api/saved-jobs/{test_jobs[3].id}", headers=headers)

        response = client.get("/api/saved-jobs/ids", headers=headers)

        assert response.status_code == 200
        assert sorted(response.json()) == sorted([test_jobs[0].id, test_jobs[3].id])

    def test_saved_jobs_are_isolated_per_user(self, client, test_user, second_user, test_jobs):
        first_headers = auth_headers(client, test_user)
        second_headers = auth_headers(client, second_user)

        client.post(f"/api/saved-jobs/{test_jobs[0].id}", headers=first_headers)
        client.post(f"/api/saved-jobs/{test_jobs[1].id}", headers=second_headers)

        first = client.get("/api/saved-jobs", headers=first_headers).json()
        second = client.get("/api/saved-jobs", headers=second_headers).json()

        assert [item["job_id"] for item in first["saved_jobs"]] == [test_jobs[0].id]
        assert [item["job_id"] for item in second["saved_jobs"]] == [test_jobs[1].id]

    def test_closed_job_still_listed(self, client, db_session, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job_id = test_jobs[0].id
        client.post(f"/api/saved-jobs/{job_id}", headers=headers)

        # Posting gets closed (soft-deleted) after the user saved it
        job = db_session.get(Job, job_id)
        job.is_active = False
        db_session.add(job)
        db_session.commit()

        data = client.get("/api/saved-jobs", headers=headers).json()
        assert data["total"] == 1
        assert data["saved_jobs"][0]["job"]["is_active"] is False

    def test_list_requires_auth(self, client):
        response = client.get("/api/saved-jobs")
        assert response.status_code in (401, 403)


# ==============================================================================
# Removing saved jobs
# ==============================================================================
class TestUnsaveJob:
    def test_unsave_job_success(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job_id = test_jobs[0].id
        client.post(f"/api/saved-jobs/{job_id}", headers=headers)

        response = client.delete(f"/api/saved-jobs/{job_id}", headers=headers)

        assert response.status_code == 200
        assert client.get("/api/saved-jobs", headers=headers).json()["total"] == 0

    def test_unsave_job_not_saved(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        response = client.delete(f"/api/saved-jobs/{test_jobs[0].id}", headers=headers)
        assert response.status_code == 404

    def test_unsave_does_not_affect_other_users(self, client, test_user, second_user, test_jobs):
        first_headers = auth_headers(client, test_user)
        second_headers = auth_headers(client, second_user)
        job_id = test_jobs[0].id

        client.post(f"/api/saved-jobs/{job_id}", headers=first_headers)
        client.post(f"/api/saved-jobs/{job_id}", headers=second_headers)

        # second_user removing their bookmark must not touch test_user's
        assert client.delete(f"/api/saved-jobs/{job_id}", headers=second_headers).status_code == 200
        assert client.delete(f"/api/saved-jobs/{job_id}", headers=second_headers).status_code == 404
        assert client.get("/api/saved-jobs", headers=first_headers).json()["total"] == 1

    def test_can_resave_after_unsave(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job_id = test_jobs[0].id

        client.post(f"/api/saved-jobs/{job_id}", headers=headers)
        client.delete(f"/api/saved-jobs/{job_id}", headers=headers)
        response = client.post(f"/api/saved-jobs/{job_id}", headers=headers)

        assert response.status_code == 201


# ==============================================================================
# Database relationship & constraints
# ==============================================================================
class TestSavedJobModel:
    def test_user_relationship_lists_saved_jobs(self, db_session, test_user, test_jobs):
        db_session.add(SavedJob(user_id=test_user["id"], job_id=test_jobs[0].id))
        db_session.add(SavedJob(user_id=test_user["id"], job_id=test_jobs[1].id))
        db_session.commit()

        user = db_session.get(User, test_user["id"])
        assert sorted(saved.job_id for saved in user.saved_jobs) == sorted([test_jobs[0].id, test_jobs[1].id])
        assert all(saved.job is not None for saved in user.saved_jobs)

    def test_unique_constraint_blocks_duplicate_rows(self, db_session, test_user, test_jobs):
        db_session.add(SavedJob(user_id=test_user["id"], job_id=test_jobs[0].id))
        db_session.commit()

        db_session.add(SavedJob(user_id=test_user["id"], job_id=test_jobs[0].id))
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_saved_at_is_set_automatically(self, db_session, test_user, test_jobs):
        saved = SavedJob(user_id=test_user["id"], job_id=test_jobs[0].id)
        db_session.add(saved)
        db_session.commit()
        db_session.refresh(saved)

        assert saved.saved_at is not None


# ==============================================================================
# Access control & edge cases
# ==============================================================================
class TestSavedJobsAccessAndEdgeCases:
    @pytest.mark.parametrize("method, path", [
        ("get", "/api/saved-jobs"),
        ("get", "/api/saved-jobs/ids"),
        ("post", "/api/saved-jobs/1"),
        ("delete", "/api/saved-jobs/1"),
    ])
    def test_endpoints_reject_recruiters(self, client, recruiter_user, method, path):
        headers = auth_headers(client, recruiter_user)
        response = getattr(client, method)(path, headers=headers)
        assert response.status_code == 403

    @pytest.mark.parametrize("method, path", [
        ("get", "/api/saved-jobs/ids"),
        ("delete", "/api/saved-jobs/1"),
    ])
    def test_endpoints_require_auth(self, client, method, path):
        response = getattr(client, method)(path)
        assert response.status_code in (401, 403)

    def test_invalid_token_rejected(self, client):
        response = client.get("/api/saved-jobs", headers={"Authorization": "Bearer not-a-real-token"})
        assert response.status_code == 401

    def test_non_integer_job_id_rejected(self, client, test_user):
        headers = auth_headers(client, test_user)
        assert client.post("/api/saved-jobs/abc", headers=headers).status_code == 422
        assert client.delete("/api/saved-jobs/abc", headers=headers).status_code == 422

    def test_ids_empty_when_nothing_saved(self, client, test_user):
        headers = auth_headers(client, test_user)
        response = client.get("/api/saved-jobs/ids", headers=headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_can_remove_job_after_it_was_closed(self, client, db_session, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job_id = test_jobs[0].id
        client.post(f"/api/saved-jobs/{job_id}", headers=headers)

        job = db_session.get(Job, job_id)
        job.is_active = False
        db_session.add(job)
        db_session.commit()

        assert client.delete(f"/api/saved-jobs/{job_id}", headers=headers).status_code == 200
        assert client.get("/api/saved-jobs/ids", headers=headers).json() == []

    def test_saved_job_response_includes_full_job_details(self, client, test_user, test_jobs):
        headers = auth_headers(client, test_user)
        job = test_jobs[0]
        client.post(f"/api/saved-jobs/{job.id}", headers=headers)

        saved_job = client.get("/api/saved-jobs", headers=headers).json()["saved_jobs"][0]["job"]
        for field in ("title", "company_name", "location", "category", "salary_min", "salary_max"):
            assert saved_job[field] == getattr(job, field)
