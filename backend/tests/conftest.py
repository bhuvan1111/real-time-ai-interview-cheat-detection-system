import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
import app.database as app_db
import app.api.websockets as app_ws
import app.main as app_main
from app.main import app
from app.models.user import User
from app.utils.security import hash_password, create_access_token

# Use in-memory SQLite with StaticPool so all threads/sessions share the same DB in test
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch global SessionLocal in modules that instantiate it directly
app_db.SessionLocal = TestingSessionLocal
app_ws.SessionLocal = TestingSessionLocal
app_main.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh in-memory database for each test function."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    admin = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("AdminSecret123"),
        role="admin"
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def candidate_user(db_session):
    cand = User(
        name="Test Candidate",
        email="candidate@test.com",
        password_hash=hash_password("CandSecret123"),
        role="candidate"
    )
    db_session.add(cand)
    db_session.commit()
    db_session.refresh(cand)
    return cand


@pytest.fixture
def admin_token(admin_user):
    return create_access_token(data={"sub": str(admin_user.id), "role": admin_user.role})


@pytest.fixture
def candidate_token(candidate_user):
    return create_access_token(data={"sub": str(candidate_user.id), "role": candidate_user.role})
