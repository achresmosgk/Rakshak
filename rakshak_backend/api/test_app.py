from fastapi.testclient import TestClient

from main import app
from settings import ADMIN_EMAIL, ADMIN_PASSWORD

client = TestClient(app)

state = {}

USER = {"name": "Test User", "email": "testuser@example.com", "password": "testpass123"}
DEVICE = {
    "device_id": "cam-001",
    "location_name": "Test Highway KM 12",
    "latitude": 26.9,
    "longitude": 75.8,
    "highway_km_marker": 12.5,
}


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_user():
    resp = client.post("/users", json=USER)
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == USER["email"]
    assert body["name"] == USER["name"]
    state["user_id"] = body["id"]


def test_create_user_duplicate_email_rejected():
    resp = client.post("/users", json=USER)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email already registered"


def test_login_wrong_password_rejected():
    resp = client.post("/users/login", json={"email": USER["email"], "password": "wrongpassword"})
    assert resp.status_code == 401


def test_login_success():
    resp = client.post("/users/login", json={"email": USER["email"], "password": USER["password"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == state["user_id"]
    assert body["token"]
    state["token"] = body["token"]


def test_protected_route_without_token_rejected():
    resp = client.get("/detections")
    assert resp.status_code == 401


def test_protected_route_with_bad_token_rejected():
    resp = client.get("/detections", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


def test_admin_login_wrong_password_rejected():
    resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": "wrongpassword"})
    assert resp.status_code == 401


def test_admin_login():
    resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert resp.status_code == 200
    body = resp.json()
    assert body["token"]
    state["admin_token"] = body["token"]


def test_create_device_without_admin_token_rejected():
    resp = client.post("/devices", json=DEVICE)
    assert resp.status_code == 401


def test_create_device_with_user_token_rejected():
    resp = client.post(
        "/devices", json=DEVICE, headers={"Authorization": f"Bearer {state['token']}"}
    )
    assert resp.status_code == 403


def test_create_device():
    resp = client.post(
        "/devices", json=DEVICE, headers={"Authorization": f"Bearer {state['admin_token']}"}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["device_id"] == DEVICE["device_id"]
    assert body["api_key"]
    state["device_api_key"] = body["api_key"]


def test_create_device_duplicate_rejected():
    resp = client.post(
        "/devices", json=DEVICE, headers={"Authorization": f"Bearer {state['admin_token']}"}
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Device already registered"


def test_list_devices_requires_admin():
    resp = client.get("/devices")
    assert resp.status_code == 401


def test_list_devices():
    resp = client.get("/devices", headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert resp.status_code == 200
    devices = resp.json()
    assert any(d["device_id"] == DEVICE["device_id"] for d in devices)


def test_get_device_by_id():
    resp = client.get(
        f"/devices/{DEVICE['device_id']}",
        headers={"Authorization": f"Bearer {state['admin_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["device_id"] == DEVICE["device_id"]


def test_get_device_not_found():
    resp = client.get(
        "/devices/does-not-exist", headers={"Authorization": f"Bearer {state['admin_token']}"}
    )
    assert resp.status_code == 404


def test_admin_list_users():
    resp = client.get("/admin/users", headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert resp.status_code == 200
    users = resp.json()
    assert any(u["email"] == USER["email"] for u in users)


def test_admin_list_users_requires_admin_not_user_token():
    resp = client.get("/admin/users", headers={"Authorization": f"Bearer {state['token']}"})
    assert resp.status_code == 403


def test_create_detection_with_invalid_api_key_rejected():
    resp = client.post(
        "/detections",
        json={"species": "nilgai", "confidence": 0.9, "latitude": 26.9, "longitude": 75.8},
        headers={"X-API-Key": "wrong-key"},
    )
    assert resp.status_code == 401


def test_create_detection():
    resp = client.post(
        "/detections",
        json={"species": "nilgai", "confidence": 0.95, "latitude": 26.9, "longitude": 75.8},
        headers={"X-API-Key": state["device_api_key"]},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["species"] == "nilgai"
    state["detection_id"] = body["id"]


def test_list_detections_requires_auth():
    resp = client.get("/detections")
    assert resp.status_code == 401


def test_list_detections_with_token():
    resp = client.get("/detections", headers={"Authorization": f"Bearer {state['token']}"})
    assert resp.status_code == 200
    detections = resp.json()
    assert any(d["id"] == state["detection_id"] for d in detections)


def test_get_detection_by_id():
    resp = client.get(
        f"/detections/{state['detection_id']}",
        headers={"Authorization": f"Bearer {state['token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == state["detection_id"]


def test_get_detection_not_found():
    resp = client.get(
        "/detections/999999",
        headers={"Authorization": f"Bearer {state['token']}"},
    )
    assert resp.status_code == 404


def test_logout():
    resp = client.post("/users/logout", headers={"Authorization": f"Bearer {state['token']}"})
    assert resp.status_code == 200
    assert resp.json() == {"message": "logged out"}


def test_logout_again_with_same_token_is_revoked():
    resp = client.post("/users/logout", headers={"Authorization": f"Bearer {state['token']}"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Token revoked"


def test_protected_route_after_logout_rejected():
    resp = client.get("/detections", headers={"Authorization": f"Bearer {state['token']}"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Token revoked"


def test_admin_logout():
    resp = client.post("/admin/logout", headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert resp.status_code == 200
    assert resp.json() == {"message": "logged out"}


def test_admin_route_after_logout_rejected():
    resp = client.get("/admin/users", headers={"Authorization": f"Bearer {state['admin_token']}"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Token revoked"
