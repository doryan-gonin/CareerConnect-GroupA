# Helper function
def login_and_get_token(client, email_address: str, password: str) -> str:
    payload = {
        "email_address": email_address,
        "password": password,
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200, f"Login failed: {response.json()}"
    return response.json()["access_token"]


# ==============================================================================
# Test Cases for Notification Endpoints and Flow
# ==============================================================================
class TestNotificationTriggers:
    def test_status_update_triggers_notification(self, client, candidate_application):
        recruiter = candidate_application["recruiter"]
        applicant = candidate_application["applicant"]
        app_id = candidate_application["application_id"]

        recruiter_token = login_and_get_token(client, recruiter["email_address"], recruiter["password"])
        applicant_token = login_and_get_token(client, applicant["email_address"], applicant["password"])

        recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
        applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

        # Recruiter updates status to Under Review
        update_res = client.patch(
            f"/api/applications/{app_id}/status",
            json={"status": "Under Review"},
            headers=recruiter_headers,
        )
        assert update_res.status_code == 200

        # Applicant receives notification
        notifs_res = client.get("/api/notifications", headers=applicant_headers)
        assert notifs_res.status_code == 200
        
        data = notifs_res.json()
        assert data["total_count"] == 1
        assert data["unread_count"] == 1
        assert data["notifications"][0]["notification_type"] == "status_update"
        assert "Under Review" in data["notifications"][0]["message"]
        assert data["notifications"][0]["reference_id"] == app_id

    def test_interview_invitation_notification(self, client, candidate_application):
        recruiter = candidate_application["recruiter"]
        applicant = candidate_application["applicant"]
        app_id = candidate_application["application_id"]

        recruiter_token = login_and_get_token(client, recruiter["email_address"], recruiter["password"])
        applicant_token = login_and_get_token(client, applicant["email_address"], applicant["password"])

        recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
        applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

        # Recruiter invites to Interview
        interview_res = client.patch(
            f"/api/applications/{app_id}/status",
            json={"status": "Interview"},
            headers=recruiter_headers,
        )
        assert interview_res.status_code == 200

        # Verify applicant received INTERVIEW_INVITATION notification
        notifs_res = client.get("/api/notifications", headers=applicant_headers)
        assert notifs_res.status_code == 200
        data = notifs_res.json()
        assert data["total_count"] == 1
        assert data["notifications"][0]["notification_type"] == "interview_invitation"
        assert "Interview Invitation" in data["notifications"][0]["title"]


class TestNotificationManagement:
    def test_get_notifications_empty(self, client, test_user):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        response = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0
        assert data["unread_count"] == 0
        assert data["notifications"] == []

    def test_get_notifications_unauthorized(self, client):
        response = client.get("/api/notifications")
        assert response.status_code == 401

    def test_mark_as_read_and_filter_unread(self, client, candidate_application):
        recruiter = candidate_application["recruiter"]
        applicant = candidate_application["applicant"]
        app_id = candidate_application["application_id"]

        recruiter_token = login_and_get_token(client, recruiter["email_address"], recruiter["password"])
        applicant_token = login_and_get_token(client, applicant["email_address"], applicant["password"])

        recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
        applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

        # Trigger 2 notifications
        client.patch(f"/api/applications/{app_id}/status", json={"status": "Under Review"}, headers=recruiter_headers)
        client.patch(f"/api/applications/{app_id}/status", json={"status": "Interview"}, headers=recruiter_headers)

        notifs_res = client.get("/api/notifications", headers=applicant_headers)
        notifications = notifs_res.json()["notifications"]
        assert len(notifications) == 2
        first_notif_id = notifications[0]["id"]

        # Mark first notification as read
        read_res = client.patch(f"/api/notifications/{first_notif_id}/read", headers=applicant_headers)
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

        # Query only unread
        unread_res = client.get("/api/notifications", params={"unread_only": True}, headers=applicant_headers)
        assert unread_res.status_code == 200
        unread_data = unread_res.json()
        assert unread_data["total_count"] == 2
        assert unread_data["unread_count"] == 1
        assert len(unread_data["notifications"]) == 1

    def test_mark_all_as_read(self, client, candidate_application):
        recruiter = candidate_application["recruiter"]
        applicant = candidate_application["applicant"]
        app_id = candidate_application["application_id"]

        recruiter_token = login_and_get_token(client, recruiter["email_address"], recruiter["password"])
        applicant_token = login_and_get_token(client, applicant["email_address"], applicant["password"])

        recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
        applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

        # Trigger notification
        client.patch(f"/api/applications/{app_id}/status", json={"status": "Under Review"}, headers=recruiter_headers)

        # Mark all as read
        read_all_res = client.patch("/api/notifications/read-all", headers=applicant_headers)
        assert read_all_res.status_code == 200

        notifs_res = client.get("/api/notifications", headers=applicant_headers)
        assert notifs_res.json()["unread_count"] == 0

    def test_delete_notification(self, client, candidate_application):
        recruiter = candidate_application["recruiter"]
        applicant = candidate_application["applicant"]
        app_id = candidate_application["application_id"]

        recruiter_token = login_and_get_token(client, recruiter["email_address"], recruiter["password"])
        applicant_token = login_and_get_token(client, applicant["email_address"], applicant["password"])

        recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}
        applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

        # Trigger notification
        client.patch(f"/api/applications/{app_id}/status", json={"status": "Offered"}, headers=recruiter_headers)

        notifs = client.get("/api/notifications", headers=applicant_headers).json()["notifications"]
        notif_id = notifs[0]["id"]

        # Other user cannot delete this notification
        other_user_res = client.delete(f"/api/notifications/{notif_id}", headers=recruiter_headers)
        assert other_user_res.status_code == 403

        # Owner deletes notification
        delete_res = client.delete(f"/api/notifications/{notif_id}", headers=applicant_headers)
        assert delete_res.status_code == 200

        # Verify it was removed
        remaining = client.get("/api/notifications", headers=applicant_headers).json()["notifications"]
        assert len(remaining) == 0
