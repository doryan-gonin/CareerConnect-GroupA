import pytest
from fastapi.testclient import TestClient

# FastAPI application instance
from src.backend.main import app

client = TestClient(app)

# Injects a test user directly in the database for testing
@pytest.fixture
def test_user():
    user_data = {
        "email": "test@example.com",
        "password": "Test@123"
    }

    # TODO: db.create_user(user_data)

    yield user_data

    # TODO: db.delete_user(user_data["email"])

# ==============================================================================
# Test Cases for the login endpoint
# ==============================================================================
class TestLogin:
    def test_sucess(self, test_user):
        payload = {
            "email": test_user()["email"],
            "password": "Test@123"
        }

        # Send the request to the endpoint
        response = client.post("/auth/login", json=payload)

        # Verify proper backend response
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_invalid_password(self, test_user):
        payload = {
            "email": test_user()["email"],
            "password": "invalidpassword"
        }

        response = client.post("/auth/login", json=payload)
        assert response.status_code == 401

    def test_unregistered_email(self):
        payload = {
            "email": "unregistered@example.com",
            "password": "anypassword"
        }
        response = client.post("/auth/login", json=payload)
        assert response.status_code == 401

# ==============================================================================
# Test Cases for the registration endpoint
# ==============================================================================
class TestRegistration:
    def test_success(self):
        payload = {
            "email": "newuser@example.com",
            "password": "NewUser@123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 201

    def test_existing_email(self, test_user):
        payload = {
            "email": test_user()["email"],
            "password": "AnotherPassword@123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400

    def test_invalid_email_format(self):
        payload = {
            "email": "invalidemail",
            "password": "ValidPassword@123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 422
