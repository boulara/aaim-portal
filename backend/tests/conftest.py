import os

# Must be set before any app module is imported so database.py picks up SQLite
os.environ["DATABASE_URL"] = "sqlite:///./test_aaim.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///./test_aaim.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client():
    # Fresh schema for every test — no leftover data
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ── Convenience fixtures ───────────────────────────────────────────────────────

@pytest.fixture()
def test_user(client):
    r = client.post("/api/users/", json={
        "username": "test.user",
        "password": "pass123",
        "name": "Test User",
        "team": "NCM",
        "role": "partner",
    })
    assert r.status_code == 201
    return r.json()


@pytest.fixture()
def test_patient(client):
    r = client.post("/api/patients/bulk", json=[{
        "prescriber": "Dr. Test Patient",
        "aging_of_status": 5,
        "region": "Southeast",
        "primary_channel": "Commercial",
    }])
    assert r.status_code == 200
    # Retrieve the just-created patient
    patients = client.get("/api/patients/").json()
    return patients[0]
