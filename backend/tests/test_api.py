from fastapi.testclient import TestClient

from tests.conftest import TEST_ADMIN_PASSWORD, TEST_ADMIN_USERNAME


def authenticate(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"username": TEST_ADMIN_USERNAME, "password": TEST_ADMIN_PASSWORD},
    )
    assert response.status_code == 200


def test_authentication_and_protected_records(client: TestClient) -> None:
    assert client.get("/api/deceased").status_code == 401
    assert client.get("/api/auth/me").status_code == 401

    invalid_login = client.post(
        "/api/auth/login",
        json={"username": TEST_ADMIN_USERNAME, "password": "wrong-password"},
    )
    assert invalid_login.status_code == 401

    authenticate(client)
    current_admin = client.get("/api/auth/me")
    assert current_admin.status_code == 200
    assert current_admin.json()["username"] == TEST_ADMIN_USERNAME
    assert client.get("/api/deceased").status_code == 200

    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/deceased").status_code == 401


def test_create_edit_validation_and_private_listing(client: TestClient) -> None:
    record = {
        "full_name": "Nombre de Prueba",
        "date_of_birth": "1940-02-10",
        "date_of_death": "2020-05-15",
        "burial_date": "2020-05-17",
        "sector": "Sector de prueba",
        "row": "Fila 2",
        "grave_number": "N-14",
        "notes": "Registro ficticio para pruebas.",
    }
    assert client.post("/api/deceased", json=record).status_code == 401
    authenticate(client)

    created_response = client.post("/api/deceased", json=record)
    assert created_response.status_code == 201
    created = created_response.json()
    assert created["full_name"] == record["full_name"]
    assert created["grave_number"] == record["grave_number"]
    assert created["created_at"]
    assert created["updated_at"]

    invalid_birth = {**record, "date_of_birth": "2021-01-01"}
    assert client.post("/api/deceased", json=invalid_birth).status_code == 422
    invalid_burial = {**record, "burial_date": "2020-05-14"}
    assert client.put(f"/api/deceased/{created['id']}", json=invalid_burial).status_code == 422

    updated = {**record, "full_name": "Nombre Actualizado", "grave_number": "N-15"}
    update_response = client.put(f"/api/deceased/{created['id']}", json=updated)
    assert update_response.status_code == 200
    assert update_response.json()["full_name"] == "Nombre Actualizado"
    assert update_response.json()["grave_number"] == "N-15"

    listing = client.get("/api/deceased", params={"search": "Actualizado", "page": 1, "page_size": 10})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["id"] == created["id"]
