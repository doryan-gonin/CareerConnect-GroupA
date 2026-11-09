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
