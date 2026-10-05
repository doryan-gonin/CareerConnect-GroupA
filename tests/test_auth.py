import pytest
import bcrypt
from fastapi.testclient import TestClient

# FastAPI application instance
from src.backend.main import app

client = TestClient(app)

# Injects a test user directly in the database for testing
@pytest.fixture
def test_user():
    plain_password = "Test@123"

    pw_bytes: bytes = plain_password.encode("utf-8")
    pw_hashed: bytes = bcrypt.hashpw(pw_bytes, bcrypt.gensalt())
    pw_hash_str: str = pw_hashed.decode("utf-8")

    user_data = {
        "email_address": "test@example.com",
        "password": pw_hash_str
    }

    # TODO: db.create_user(user_data)

    yield user_data

    # TODO: db.delete_user(user_data["email"])

# ==============================================================================
# Test Cases for the login endpoint
# ==============================================================================
class TestLogin:
    def test_success(self, test_user):
        payload = {
            "email_address": test_user["email_address"],
            "password": "Test@123"
        }

        # Send the request to the endpoint
        response = client.post("/api/auth/login", json=payload)

        print(response.json()) #Temp debugging

        # Verify proper backend response
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_invalid_password(self, test_user):
        payload = {
            "email_address": test_user["email_address"],
            "password": "invalidpassword"
        }

        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

    def test_unregistered_email(self):
        payload = {
            "email_address": "unregistered@example.com",
            "password": "anypassword"
        }
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401

# ==============================================================================
# Test Cases for the registration endpoint
# ==============================================================================
class TestRegistration:
    def test_success(self):
        payload = {
            "email_address": "newuser@example.com",
            "password": "NewUser@123"
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201

    def test_existing_email(self, test_user):
        payload = {
            "email_address": test_user["email_address"],
            "password": "AnotherPassword@123"
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 400

    def test_invalid_email_format(self):
        payload = {
            "email_address": "invalidemail",
            "password": "ValidPassword@123"
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422
