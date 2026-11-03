# Helper function
import pytest


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
# Test Cases for /applications endpoint
# ==============================================================================
class TestApplicationAnalytics:
    def test_application_analytics_success(self, client, test_user, test_applications):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        applications_count = test_applications
        
        response = client.get(
            "/api/analytics/applications",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "group_by": "month"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 200
        data = response.json()
        
        assert data["start_date"] == "2026-01-01"
        assert data["end_date"] == "2026-12-31"
        assert data["group_by"] == "month"
        assert len(data["points"]) == 12 # There should be 12 months in the response
        assert sum(point["count"] for point in data["points"]) == applications_count

    def test_application_analytics_invalid_query(self, client, test_user):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        response = client.get(
            "/api/analytics/applications",
            params={
                "start_date": "2026-12-31",
                "end_date": "2026-01-01",
                "group_by": "month"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 422
        data = response.json()

        assert data["detail"] == "start_date must be on or before end_date."

# ==============================================================================
# Test Cases for /searches endpoint
# ==============================================================================
class TestSearchAnalytics:
    def test_search_analytics_success(self, client, test_user, test_searches):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        
        response = client.get(
            "/api/analytics/searches",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "group_by": "month"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 200
        data = response.json()
        
        assert data["start_date"] == "2026-01-01"
        assert data["end_date"] == "2026-12-31"
        assert data["group_by"] == "month"
        assert len(data["points"]) == 12 # There should be 12 months in the response
        assert sum(point["count"] for point in data["points"]) == test_searches

    def test_search_analytics_invalid_query(self, client, test_user):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        response = client.get(
            "/api/analytics/searches",
            params={
                "start_date": "2026-12-31",
                "end_date": "2026-01-01",
                "group_by": "month"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 422
        data = response.json()

        assert data["detail"] == "start_date must be on or before end_date."

# ==============================================================================
# Test Cases for /views endpoint
# ==============================================================================
class TestViewAnalytics:
    def test_view_analytics_success(self, client, test_user, test_views):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        
        response = client.get(
            "/api/analytics/views",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "group_by": "month"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 200
        data = response.json()
        
        assert data["start_date"] == "2026-01-01"
        assert data["end_date"] == "2026-12-31"
        assert data["group_by"] == "month"
        assert len(data["points"]) == 12 # There should be 12 months in the response
        assert sum(point["unique_postings"] for point in data["points"]) == test_views

    def test_view_analytics_invalid_query(self, client, test_user):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        response = client.get(
            "/api/analytics/views",
            params={
                "start_date": "2026-12-31",
                "end_date": "2026-01-01",
                "group_by": "month"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 422
        data = response.json()

        assert data["detail"] == "start_date must be on or before end_date."

# ==============================================================================
# Test Cases for /salary-distribution endpoint
# ==============================================================================
class TestSalaryDistribution:
    def test_salary_distribution_success(self, client, test_user, test_jobs, test_applications):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        salaries = [
            (job.salary_min + job.salary_max) / 2 
            for job in test_jobs
            if job.salary_min is not None and job.salary_max is not None
        ]

        # Expected values
        expect_avg = sum(salaries) / len(salaries)
        expect_min = min(salaries)
        expect_max = max(salaries)
        expect_var = sum((salary - expect_avg) ** 2 for salary in salaries) / len(salaries)
        expect_dev = expect_var ** 0.5 

        response = client.get(
            "/api/analytics/salary-distribution",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-12-31"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 200
        data = response.json()

        assert data["salary_count"] == len(salaries)
        assert data["average_salary"] == pytest.approx(expect_avg)
        assert data["minimum_salary"] == pytest.approx(expect_min)
        assert data["maximum_salary"] == pytest.approx(expect_max)
        assert data["standard_deviation"] == pytest.approx(expect_dev)

# ==============================================================================
# Test Cases for /application-summary endpoint
# ==============================================================================
class TestApplicationSummary:
    def test_application_summary_success(self, client, test_user, test_jobs, test_applications):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])
        
        response = client.get(
            "/api/analytics/application-summary",
            params={
                "start_date": "2026-01-01",
                "end_date": "2026-12-31"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 200
        data = response.json()
        
        assert data["start_date"] == "2026-01-01"
        assert data["end_date"] == "2026-12-31"

        assert data["category"] == "Engineering"
        assert data["category_count"] == 4

        assert data["location"] == "Location 5"
        assert data["location_count"] == 1

    def test_application_summary_invalid_query(self, client, test_user):
        token = login_and_get_token(client, test_user["email_address"], test_user["password"])

        response = client.get(
            "/api/analytics/application-summary",
            params={
                "start_date": "2026-12-31",
                "end_date": "2026-01-01"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify the response
        assert response.status_code == 422
        data = response.json()

        assert data["detail"] == "start_date must be on or before end_date."
