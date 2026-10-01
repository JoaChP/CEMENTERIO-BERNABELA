import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-only-secret-that-is-long-enough"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["COOKIE_SECURE"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_session
from app.core.security import hash_password
from app.main import app
from app.models import Administrator

TEST_ADMIN_USERNAME = "test-admin"
TEST_ADMIN_PASSWORD = "test-password-123"


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(engine)
    with testing_session() as session:
        session.add(Administrator(username=TEST_ADMIN_USERNAME, password_hash=hash_password(TEST_ADMIN_PASSWORD)))
        session.commit()

    def override_session():
        with testing_session() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()
