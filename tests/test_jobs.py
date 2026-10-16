# ==============================================================================
# Test Cases for job search (with filters)
# ==============================================================================
class TestGETAllJobs:
    def test_get_success(self, client, test_jobs):
        response = client.get("/api/jobs")

        # Verify the response
        assert response.status_code == 200
        jobs_data = response.json()
        assert isinstance(jobs_data, dict)
        assert len(jobs_data["jobs"]) == 5  # We added 5 jobs in the fixture
        assert jobs_data["total"] == 5

    def test_filter_keyword(self, client, test_jobs):
        response = client.get("/api/jobs?keyword=Job%20Title%203")

        # Verify the response
        assert response.status_code == 200

        jobs_data = response.json()
        assert jobs_data["total"] == 1
        assert len(jobs_data["jobs"]) == 1
        assert jobs_data["jobs"][0]["title"] == "Job Title 3"

    def test_filter_location(self, client, test_jobs):
        response = client.get("/api/jobs", params={"location": "Location 2"})

        assert response.status_code == 200
        jobs_data = response.json()
        assert jobs_data["total"] == 1
        assert jobs_data["jobs"][0]["location"] == "Location 2"

    def test_filter_category(self, client, test_jobs):
        response = client.get("/api/jobs", params={"category": "Design"})

        assert response.status_code == 200
        jobs_data = response.json()
        assert jobs_data["total"] == 1
        assert jobs_data["jobs"][0]["category"] == "Design"

    def test_pagination_success(self, client, test_jobs):
        response = client.get("/api/jobs", params={"page": 2, "limit": 2})

        assert response.status_code == 200

        jobs_data = response.json()
        assert jobs_data["page"] == 2
        assert jobs_data["limit"] == 2
        assert jobs_data["total"] == 5
        assert jobs_data["total_pages"] == 3
        assert len(jobs_data["jobs"]) == 2

    def test_pagination_invalid(self, client, test_jobs):
        response = client.get("/api/jobs", params={"page": 0, "limit": 101})

        assert response.status_code == 422

    def test_inactive_jobs_success(self, client, test_jobs, inactive_job):
        response = client.get("/api/jobs")

        assert response.status_code == 200

        jobs_data = response.json()
        assert jobs_data["total"] == 5
        assert all(job["id"] != inactive_job.id for job in jobs_data["jobs"])

# ==============================================================================
# Test Cases for job search by ID
# ==============================================================================
class TestGETJobByID:
    def test_get_success(self, client, test_jobs):
        job = test_jobs[0]
        response = client.get(f"/api/jobs/{job.id}")

        assert response.status_code == 200
        assert response.json()["id"] == job.id
        assert response.json()["title"] == job.title

    def test_job_not_found(self, client, test_jobs):
        response = client.get("/api/jobs/9999")

        assert response.status_code == 404

    def test_invalid_id(self, client):
        response = client.get("/api/jobs/not-an-integer")

        assert response.status_code == 422

    def test_inactive_job(self, client, inactive_job):
        response = client.get(f"/api/jobs/{inactive_job.id}")

        assert response.status_code == 404


