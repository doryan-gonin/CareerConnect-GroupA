# ------------------------------ Helper Functions ------------------------------
# Maybe logging in each time isn't the best
# Also, those should ideally be fixtures (this is just to test the tests ;D)
def login_and_get_token(client, email_address: str, password: str) -> str:
    payload = {
        "email_address": email_address,
        "password": password
    }

    response = client.post("/api/auth/login", json=payload)

    # Verify correct login and extract token
    assert response.status_code == 200, f"Login failed: {response.json()}"
    return response.json()["access_token"]

# ==============================================================================
# Test Cases for the profile endpoint
# ==============================================================================
class TestProfile:
    def test_get_success(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Use the access token to get the profile
        profile_response = client.get("/api/profiles/me", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert profile_response.status_code == 200
        assert "id" in profile_response.json()
        assert "first_name" in profile_response.json()
        assert "last_name" in profile_response.json()

        # Verify the profile data
        profile_data = profile_response.json()
        assert profile_data["first_name"] == ""
        assert profile_data["last_name"] == ""

    def test_set_success(self, test_user, client):
        # Log in to get the token
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Use the access token to update the profile
        update_payload = {
            "first_name": "John",
            "last_name": "Doe"
        }

        update_response = client.put("/api/profiles/me", json=update_payload, headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert update_response.status_code == 200
        
        # Verify the updated profile data
        updated_profile = update_response.json()
        assert updated_profile["first_name"] == "John"
        assert updated_profile["last_name"] == "Doe"

# ==============================================================================
# Test Cases for the resumes endpoint
# ==============================================================================
class TestResumes:
    def test_get_all(self, test_user, client, add_resumes_for_user):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Use the token to get all resumes
        resumes_response = client.get("/api/profiles/me/resumes", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert resumes_response.status_code == 200
        assert isinstance(resumes_response.json(), list)
        assert len(resumes_response.json()) == 3  

    def test_get_specific_success(self, test_user, client, add_resumes_for_user):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        resume = add_resumes_for_user[0]  # Get the first resume added for the user
        specific_resume_response = client.get(f"/api/profiles/me/resumes/{resume.id}", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response --> There is no response, it download the file
        assert specific_resume_response.status_code == 200
        assert specific_resume_response.headers["content-type"] == "application/pdf"
        assert specific_resume_response.content.startswith(b"%PDF")  # Check if the content starts with PDF header

    def test_get_specific_not_found(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Use the token and get a non-existent resume (e.g., ID 999)
        non_existent_resume_id = 999
        specific_resume_response = client.get(f"/api/profiles/me/resumes/{non_existent_resume_id}", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert specific_resume_response.status_code == 404

# -------------------------------- Upload Tests --------------------------------
    def test_upload_success(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Create a dummy PDF
        dummy_pdf = b"%PDF-1.4\n%Dummy PDF content"

        files = {"file": ("dummy_resume.pdf", dummy_pdf, "application/pdf")}
        upload_response = client.post("/api/profiles/me/resumes", files=files, headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert upload_response.status_code == 201

    def test_upload_non_pdf(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        
        # Create a dummy text file
        dummy_text = b"Dummy text content"
        
        files = {"file": ("dummy_resume.txt", dummy_text, "text/plain")}
        upload_response = client.post("/api/profiles/me/resumes", files=files, headers={"Authorization": f"Bearer {access_token}"})
        
        # Verify the response
        assert upload_response.status_code == 400

    def test_upload_oversize(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        
        # Create a dummy PDF larger than 5MB
        oversize_pdf = b"%PDF-1.4\n" + b"A" * (5 * 1024 * 1024 + 1)  # Just over 5MB
        
        files = {"file": ("oversize_resume.pdf", oversize_pdf, "application/pdf")}
        upload_response = client.post("/api/profiles/me/resumes", files=files, headers={"Authorization": f"Bearer {access_token}"})
        
        # Verify the response
        assert upload_response.status_code == 413

    def test_upload_too_many(self, test_user, client, add_resumes_for_user):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Create a dummy PDF
        for i in range(3):
            dummy_pdf = b"%PDF-1.4\n%Dummy PDF content"
            files = {"file": ("dummy_resume.pdf", dummy_pdf, "application/pdf")}
            upload_response = client.post("/api/profiles/me/resumes", files=files, headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert upload_response.status_code == 403

# ------------------------------------------------------------------------------

    def test_set_default_success(self, test_user, client, add_resumes_for_user):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Set resume n°2 as default
        resume_to_set_default = add_resumes_for_user[1]
        set_default_response = client.patch(f"/api/profiles/me/resumes/{resume_to_set_default.id}/default", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert set_default_response.status_code == 200
        assert set_default_response.json()["is_default"] is True

        # Verify it stays default and the previous gets reset
        resumes_response = client.get("/api/profiles/me/resumes", headers={"Authorization": f"Bearer {access_token}"})
        resumes_by_id = {resume["id"]: resume for resume in resumes_response.json()}
        assert resumes_by_id[resume_to_set_default.id]["is_default"] is True
        assert resumes_by_id[add_resumes_for_user[0].id]["is_default"] is False

    def test_set_default_failure(self, test_user, client, add_resumes_for_user):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Try to set a non-existent resume as default
        set_default_response = client.patch(f"/api/profiles/me/resumes/999/default", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert set_default_response.status_code == 404

    def test_cannot_access_others_resume(self, test_user, second_user, client, add_resumes_for_user):
        access_token = login_and_get_token(client, second_user["email_address"], second_user["password"])
        resume = add_resumes_for_user[0]

        response = client.get(
            f"/api/profiles/me/resumes/{resume.id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 404

    def test_delete_success(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Create a dummy PDF
        dummy_pdf = b"%PDF-1.4\n%Dummy PDF content"
        files = {"file": ("dummy_resume.pdf", dummy_pdf, "application/pdf")}
        upload_response = client.post("/api/profiles/me/resumes", files=files, headers={"Authorization": f"Bearer {access_token}"})

        # Verify the upload
        assert upload_response.status_code == 201
        uploaded_resume_id = upload_response.json()["id"]

        # Delete the uploaded resume
        delete_response = client.delete(f"/api/profiles/me/resumes/{uploaded_resume_id}", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the delete
        assert delete_response.status_code == 204

    def test_delete_failure(self, test_user, client):
        access_token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        # Try to delete a non-existent resume
        delete_response = client.delete(f"/api/profiles/me/resumes/999", headers={"Authorization": f"Bearer {access_token}"})

        # Verify the response
        assert delete_response.status_code == 404
