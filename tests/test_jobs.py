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

    def test_sort_salary_desc(self, client, test_jobs):
        response = client.get("api/jobs", params={"sort_by": "salary_max", "sort_order": "desc"})

        # Verify the response
        assert response.status_code == 200

        salaries = [
            job["salary_max"]
            for job in response.json()["jobs"]
        ]

        assert salaries == sorted(salaries, reverse=True)

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

    def test_sort_consistency(self, client, test_jobs):
        all_jobs = client.get("/api/jobs", params={"sort_by": "salary_max", "sort_order": "desc", "limit": 100}).json()["jobs"]

        page_1 = client.get("/api/jobs", params={"sort_by": "salary_max", "sort_order": "desc", "page": 1, "limit": 2}).json()["jobs"]
        page_2 = client.get("/api/jobs", params={"sort_by": "salary_max", "sort_order": "desc", "page": 2, "limit": 2}).json()["jobs"]

        paginated_jobs = page_1 + page_2

        assert [job["id"] for job in paginated_jobs] == [job["id"] for job in all_jobs[:4]]

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


# ==============================================================================
# Test Cases for recruiter applicant filtering & sorting
# ==============================================================================
class TestGetJobApplicationsFiltering:
    def _seed_job_and_applications(self, client, db_session, recruiter_user, test_user, second_user):
        from datetime import datetime, timedelta, timezone
        import bcrypt
        from backend.models import Application, ApplicationStatus, Job, User

        login_res = client.post(
            "/api/auth/login",
            json={
                "email_address": recruiter_user["email_address"],
                "password": recruiter_user["password"],
            },
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.json()}"
        token = login_res.json()["access_token"]

        job = Job(
            recruiter_id=recruiter_user["id"],
            title="Backend Engineer",
            company_name="Acme",
            description="Build APIs",
            location="Remote",
            category="Engineering",
        )
        db_session.add(job)
        db_session.commit()
        db_session.refresh(job)

        hashed_pw = bcrypt.hashpw(b"Password123!", bcrypt.gensalt()).decode("utf-8")
        third_user = User(
            email_address="third@example.com",
            password_hash=hashed_pw,
            is_recruiter=False,
        )
        db_session.add(third_user)
        db_session.commit()
        db_session.refresh(third_user)

        now = datetime.now(timezone.utc)
        apps = [
            Application(
                job_id=job.id,
                applicant_id=test_user["id"],
                status=ApplicationStatus.INTERVIEW,
                languages=[{"language": "English", "fluency_level": "Native"}],
                applied_at=now - timedelta(days=2),
            ),
            Application(
                job_id=job.id,
                applicant_id=second_user["id"],
                status=ApplicationStatus.APPLIED,
                languages=[{"language": "French", "fluency_level": "Fluent"}],
                applied_at=now - timedelta(days=1),
            ),
            Application(
                job_id=job.id,
                applicant_id=third_user.id,
                status=ApplicationStatus.REJECTED,
                languages=[
                    {"language": "English", "fluency_level": "Fluent"},
                    {"language": "Spanish", "fluency_level": "Basic"},
                ],
                applied_at=now,
            ),
        ]
        for app in apps:
            db_session.add(app)
        db_session.commit()
        return job, token

    def test_filter_multiple_statuses(
        self, client, db_session, recruiter_user, test_user, second_user
    ):
        job, token = self._seed_job_and_applications(
            client, db_session, recruiter_user, test_user, second_user
        )
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get(
            f"/api/jobs/{job.id}/applications",
            params=[("status", "Applied"), ("status", "Interview")],
            headers=headers,
        )
        assert response.status_code == 200
        statuses = {item["status"] for item in response.json()}
        assert statuses == {"Applied", "Interview"}

    def test_filter_by_language_case_insensitive(
        self, client, db_session, recruiter_user, test_user, second_user
    ):
        job, token = self._seed_job_and_applications(
            client, db_session, recruiter_user, test_user, second_user
        )
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get(
            f"/api/jobs/{job.id}/applications",
            params={"language": "english"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(
            any("english" in (lang.get("language") or "").lower() for lang in item["languages"])
            for item in data
        )

    def test_sort_by_pipeline_status(
        self, client, db_session, recruiter_user, test_user, second_user
    ):
        job, token = self._seed_job_and_applications(
            client, db_session, recruiter_user, test_user, second_user
        )
        headers = {"Authorization": f"Bearer {token}"}

        asc_res = client.get(
            f"/api/jobs/{job.id}/applications",
            params={"sort_by": "status", "sort_order": "asc"},
            headers=headers,
        )
        assert asc_res.status_code == 200
        assert [item["status"] for item in asc_res.json()] == [
            "Applied",
            "Interview",
            "Rejected",
        ]

        desc_res = client.get(
            f"/api/jobs/{job.id}/applications",
            params={"sort_by": "status", "sort_order": "desc"},
            headers=headers,
        )
        assert desc_res.status_code == 200
        assert [item["status"] for item in desc_res.json()] == [
            "Rejected",
            "Interview",
            "Applied",
        ]

    def test_sort_by_applied_at_asc(
        self, client, db_session, recruiter_user, test_user, second_user
    ):
        job, token = self._seed_job_and_applications(
            client, db_session, recruiter_user, test_user, second_user
        )
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get(
            f"/api/jobs/{job.id}/applications",
            params={"sort_by": "applied_at", "sort_order": "asc"},
            headers=headers,
        )
        assert response.status_code == 200
        dates = [item["applied_at"] for item in response.json()]
        assert dates == sorted(dates)


