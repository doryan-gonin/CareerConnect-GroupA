"""Authentication dependency edge cases that are hard to reach through happy paths."""

from datetime import datetime, timedelta, timezone

import jwt

from backend.config import ALGORITHM, SECRET_KEY


def _token(payload):
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def test_required_auth_rejects_malformed_and_incomplete_tokens(client):
    expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
    cases = [
        ("not-a-jwt", "Invalid or expired token."),
        (_token({"sub": "1", "exp": expiry}), "Invalid or expired token."),
        (_token({"exp": expiry, "jti": "missing-sub"}), "Invalid token subject."),
        (_token({"sub": "not-an-int", "exp": expiry, "jti": "bad-sub"}), "Invalid token subject."),
        (_token({"sub": "99999", "exp": expiry, "jti": "unknown-user"}), "User not found."),
    ]

    for token, detail in cases:
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        assert response.json()["detail"] == detail


def test_optional_auth_ignores_invalid_and_revoked_tokens(client, test_user, test_jobs):
    job_id = test_jobs[0].id
    malformed = client.get(
        f"/api/jobs/{job_id}", headers={"Authorization": "Bearer not-a-jwt"}
    )
    assert malformed.status_code == 200

    no_sub = _token(
        {"exp": datetime.now(timezone.utc) + timedelta(minutes=5), "jti": "optional-no-sub"}
    )
    assert client.get(
        f"/api/jobs/{job_id}", headers={"Authorization": f"Bearer {no_sub}"}
    ).status_code == 200

    login = client.post(
        "/api/auth/login",
        json={"email_address": test_user["email_address"], "password": test_user["password"]},
    )
    token = login.json()["access_token"]
    logged_out = client.post(
        "/api/auth/logout", headers={"Authorization": f"Bearer {token}"}
    )
    assert logged_out.status_code == 204

    revoked = client.get(
        f"/api/jobs/{job_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert revoked.status_code == 200
