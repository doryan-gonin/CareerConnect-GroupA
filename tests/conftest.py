import pytest
import bcrypt
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool
import datetime

from backend.main import app
from backend.database import get_session
from backend.models import User, Resume, Job, JobType, JobSchedule

# Creates an in-memory DB with static pool to ensure the same connection
sqlite_url = "sqlite://"
engine = create_engine(
    sqlite_url,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    # Creates all tables before each test
    SQLModel.metadata.create_all(engine)
    
    yield  # Tests run here

    # Drops all tables after each test
    SQLModel.metadata.drop_all(engine)

@pytest.fixture
def client():
    # Provides a test client with overidden DB dependency
    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_db

    # Yield the client so tests can use it
    with TestClient(app) as test_client:
        yield test_client

    # Clears override after the test
    app.dependency_overrides.clear()

@pytest.fixture
def test_user():
    # Creates a test user in the database for testing
    plain_password = "Test@123"
    hashed_password = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    with Session(engine) as session:
        db_user = User(
            email_address="test@example.com",
            password_hash=hashed_password
        )
        session.add(db_user)

        session.commit()
        session.refresh(db_user)

        return {
            "id": db_user.id, 
            "email_address": db_user.email_address,
            "password": plain_password
        }

@pytest.fixture
def second_user():
    plain_password = "Test@123"
    hashed_password = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    with Session(engine) as session:
        db_user = User(
            email_address="second@example.com",
            password_hash=hashed_password
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        return {
            "id": db_user.id,
            "email_address": db_user.email_address,
            "password": plain_password
        }

@pytest.fixture
def add_resumes_for_user(test_user, tmp_path):
    resumes = []

    with Session(engine) as session:
        for i in range(3):
            file_path = tmp_path / f"resume_{i}.pdf"
            file_path.write_bytes(b"%PDF-1.4 test PDF")

            resume = Resume(
                user_id=test_user["id"],
                file_name=f"resume_{i}.pdf",
                file_path=str(file_path),
                is_default=(i == 0)  # Make the first one default
            )
            session.add(resume)
            resumes.append(resume)

        session.commit()

        for resume in resumes:
            session.refresh(resume)

    return resumes

@pytest.fixture
def test_jobs():
    jobs = []
    with Session(engine) as session:
        for i in range(5):
            job = Job(
                recruiter_id = i + 1,
                title = f"Job Title {i + 1}",
                company_name = f"Company {i + 1}",
                description = f"Description for job {i + 1}",
                location = f"Location {i + 1}",
                category = "Engineering",
                job_type = JobType.PERMANENT,
                job_schedule = JobSchedule.FULL_TIME,
                min_hours_per_week = 40,
                max_hours_per_week = 40,
                salary_min = 50000 + i * 1000,
                salary_max = 70000 + i * 1000,
                posted_at = datetime.datetime.now()
            )

            session.add(job)
            jobs.append(job)

        session.commit()
        for job in jobs:
            session.refresh(job)

    return jobs
