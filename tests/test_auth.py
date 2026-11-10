# ==============================================================================
# Test Cases for the login endpoint
# ==============================================================================
class TestLogin:
    def test_success(self, test_user, client):
        payload = {
            "email_address": test_user["email_address"],
            "password": "Test@123"
        }

        # Send the request to the endpoint
        response = client.post("/api/auth/login", json=payload)

        # Verify proper backend response
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_invalid_password(self, test_user, client):
        payload = {
            "email_address": test_user["email_address"],
            "password": "invalidpassword"
        }

        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    def test_unregistered_email(self, client):
        payload = {
            "email_address": "unregistered@example.com",
            "password": "anypassword"
        }
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    def test_account_lockout_after_five_failed_attempts(self, test_user, client):
        payload = {
            "email_address": test_user["email_address"],
            "password": "wrongpassword",
        }
        for _ in range(5):
            res = client.post("/api/auth/login", json=payload)
            assert res.status_code == 401

        # 6th attempt is blocked by lockout
        locked_res = client.post("/api/auth/login", json=payload)
        assert locked_res.status_code == 403
        assert "Too many failed attempts" in locked_res.json()["detail"]

    def test_account_relockout_fixed_after_lockout_expires(self, test_user, client, db_session):
        from sqlmodel import select
        from datetime import datetime, timezone, timedelta
        from backend.models import User

        # Trigger lockout (5 failures)
        payload = {
            "email_address": test_user["email_address"],
            "password": "wrongpassword",
        }
        for _ in range(5):
            client.post("/api/auth/login", json=payload)

        # Confirm locked out
        res = client.post("/api/auth/login", json=payload)
        assert res.status_code == 403

        # Simulate lockout period expiring by setting locked_until in the past
        user = db_session.exec(select(User).where(User.id == test_user["id"])).first()
        user.locked_until = datetime.now(timezone.utc) - timedelta(minutes=1)
        db_session.add(user)
        db_session.commit()

        # Mistyping password ONCE after lockout expiry should return 401, NOT re-lock with 403
        first_attempt_after_expiry = client.post("/api/auth/login", json=payload)
        assert first_attempt_after_expiry.status_code == 401
        assert "Invalid email or password" in first_attempt_after_expiry.json()["detail"]

        # Check DB state: attempts reset to 1 (not 6)
        db_session.refresh(user)
        assert user.failed_attempts == 1
        assert user.locked_until is None

        # Correct password succeeds
        login_res = client.post(
            "/api/auth/login",
            json={"email_address": test_user["email_address"], "password": test_user["password"]},
        )
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        # Counter fully reset to 0
        db_session.refresh(user)
        assert user.failed_attempts == 0
        assert user.locked_until is None

# ==============================================================================
# Test Cases for the registration endpoint
# ==============================================================================
class TestRegistration:
    def test_success(self, client):
        payload = {
            "email_address": "newuser@example.com",
            "password": "NewUser@123"
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201

    def test_registration_creates_profile(self, client, db_session):
        from sqlmodel import select
        from backend.models import User, Profile

        email = "profile_check@example.com"
        payload = {
            "email_address": email,
            "password": "Password@123",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        created_user_id = response.json()["id"]

        # Verify profile was created in database
        profile = db_session.exec(select(Profile).where(Profile.user_id == created_user_id)).first()
        assert profile is not None
        assert profile.first_name == ""
        assert profile.last_name == ""

        # Verify access via relationship
        user = db_session.exec(select(User).where(User.id == created_user_id)).first()
        assert user is not None
        assert user.profile is not None
        assert user.profile.id == profile.id

    def test_existing_email(self, test_user, client):
        payload = {
            "email_address": test_user["email_address"],
            "password": "AnotherPassword@123"
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 400

    def test_invalid_email_format(self, client):
        payload = {
            "email_address": "invalidemail",
            "password": "ValidPassword@123"
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_registration_as_recruiter(self, client, db_session):
        from sqlmodel import select
        from backend.models import User

        payload = {
            "email_address": "newrecruiter@example.com",
            "password": "Recruiter@123",
            "is_recruiter": True,
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["is_recruiter"] is True

        user = db_session.exec(select(User).where(User.email_address == "newrecruiter@example.com")).first()
        assert user is not None
        assert user.is_recruiter is True

    def test_registration_as_applicant_default(self, client):
        payload = {
            "email_address": "newapplicant@example.com",
            "password": "Applicant@123",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        assert response.json()["is_recruiter"] is False


# ==============================================================================
# Test Cases for Recruiter vs Applicant Role Permissions
# ==============================================================================
class TestRolePermissions:
    def test_login_and_me_return_is_recruiter(self, client, test_user, recruiter_user):
        # Applicant login
        app_res = client.post("/api/auth/login", json={"email_address": test_user["email_address"], "password": test_user["password"]})
        assert app_res.status_code == 200
        assert app_res.json()["is_recruiter"] is False
        app_token = app_res.json()["access_token"]

        me_app = client.get("/api/auth/me", headers={"Authorization": f"Bearer {app_token}"})
        assert me_app.status_code == 200
        assert me_app.json()["is_recruiter"] is False

        # Recruiter login
        rec_res = client.post("/api/auth/login", json={"email_address": recruiter_user["email_address"], "password": recruiter_user["password"]})
        assert rec_res.status_code == 200
        assert rec_res.json()["is_recruiter"] is True
        rec_token = rec_res.json()["access_token"]

        me_rec = client.get("/api/auth/me", headers={"Authorization": f"Bearer {rec_token}"})
        assert me_rec.status_code == 200
        assert me_rec.json()["is_recruiter"] is True

    def test_recruiter_can_post_and_applicant_cannot(self, client, test_user, recruiter_user):
        app_res = client.post("/api/auth/login", json={"email_address": test_user["email_address"], "password": test_user["password"]})
        app_token = app_res.json()["access_token"]

        rec_res = client.post("/api/auth/login", json={"email_address": recruiter_user["email_address"], "password": recruiter_user["password"]})
        rec_token = rec_res.json()["access_token"]

        job_payload = {
            "title": "Backend Developer",
            "company_name": "Acme Corp",
            "description": "Build high performance APIs",
            "location": "Montreal",
            "category": "Engineering",
            "job_type": "Permanent",
            "job_schedule": "Full-time",
        }

        # Applicant cannot post a job
        app_post = client.post("/api/jobs", json=job_payload, headers={"Authorization": f"Bearer {app_token}"})
        assert app_post.status_code == 403
        assert "Only recruiters" in app_post.json()["detail"]

        # Recruiter can post a job
        rec_post = client.post("/api/jobs", json=job_payload, headers={"Authorization": f"Bearer {rec_token}"})
        assert rec_post.status_code == 201
        created_job = rec_post.json()
        assert created_job["title"] == "Backend Developer"

        # Applicant cannot list recruiter jobs
        app_mine = client.get("/api/jobs/mine", headers={"Authorization": f"Bearer {app_token}"})
        assert app_mine.status_code == 403

        # Recruiter can list recruiter jobs
        rec_mine = client.get("/api/jobs/mine", headers={"Authorization": f"Bearer {rec_token}"})
        assert rec_mine.status_code == 200
        assert len(rec_mine.json()) >= 1

    def test_applicant_can_apply_and_recruiter_cannot(self, client, test_user, recruiter_user):
        app_res = client.post("/api/auth/login", json={"email_address": test_user["email_address"], "password": test_user["password"]})
        app_token = app_res.json()["access_token"]

        rec_res = client.post("/api/auth/login", json={"email_address": recruiter_user["email_address"], "password": recruiter_user["password"]})
        rec_token = rec_res.json()["access_token"]

        # Recruiter posts a job
        job_res = client.post(
            "/api/jobs",
            json={
                "title": "Frontend Engineer",
                "company_name": "Test Co",
                "description": "React developer",
                "location": "Montreal",
                "category": "Engineering",
                "job_type": "Permanent",
                "job_schedule": "Full-time",
            },
            headers={"Authorization": f"Bearer {rec_token}"},
        )
        assert job_res.status_code == 201
        job_id = job_res.json()["id"]

        # Recruiter cannot upload a resume
        rec_upload = client.post(
            "/api/profiles/me/resumes",
            files={"file": ("resume.pdf", b"%PDF-1.4 test", "application/pdf")},
            headers={"Authorization": f"Bearer {rec_token}"},
        )
        assert rec_upload.status_code == 403

        # Recruiter cannot apply to a job
        rec_apply = client.post(
            f"/api/jobs/{job_id}/apply",
            json={"cover_letter": "I want to apply"},
            headers={"Authorization": f"Bearer {rec_token}"},
        )
        assert rec_apply.status_code == 403

        # Recruiter cannot view candidate applications list
        rec_apps = client.get("/api/applications/me", headers={"Authorization": f"Bearer {rec_token}"})
        assert rec_apps.status_code == 403

        # Applicant can upload a resume and apply
        app_upload = client.post(
            "/api/profiles/me/resumes",
            files={"file": ("applicant.pdf", b"%PDF-1.4 test", "application/pdf")},
            headers={"Authorization": f"Bearer {app_token}"},
        )
        assert app_upload.status_code == 201

        app_apply = client.post(
            f"/api/jobs/{job_id}/apply",
            json={"cover_letter": "I am a candidate"},
            headers={"Authorization": f"Bearer {app_token}"},
        )
        assert app_apply.status_code == 201

        # Applicant can view their applications list
        app_apps = client.get("/api/applications/me", headers={"Authorization": f"Bearer {app_token}"})
        assert app_apps.status_code == 200
        assert len(app_apps.json()) == 1
