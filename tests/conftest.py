import pytest
import bcrypt
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

from src.backend.main import app
from src.backend.database import get_session
from src.backend.models import User

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
            "email_address": db_user.email_address,
            "password": plain_password
        }
