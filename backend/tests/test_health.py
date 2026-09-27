from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "OPERATIONAL"
    assert "total_cameras" in data


def test_cameras_list():
    r = client.get("/api/cameras")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_trace_any_plate():
    r = client.post("/api/trace", json={"plate_number": "GJ01AB1234"})
    assert r.status_code == 200
    data = r.json()
    assert data["total_checkpoints"] >= 1
    assert "waypoints" in data
