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
    assert created["known_as"] is None
    assert created["created_at"]
    assert created["updated_at"]
    assert created["created_at"].endswith(("Z", "+00:00"))
    assert created["updated_at"].endswith(("Z", "+00:00"))

    invalid_birth = {**record, "date_of_birth": "2021-01-01"}
    assert client.post("/api/deceased", json=invalid_birth).status_code == 422
    invalid_burial = {**record, "burial_date": "2020-05-14"}
    assert client.put(f"/api/deceased/{created['id']}", json=invalid_burial).status_code == 422

    updated = {**record, "full_name": "Nombre Actualizado", "grave_number": "N-15", "known_as": "  Apodo de prueba  "}
    update_response = client.put(f"/api/deceased/{created['id']}", json=updated)
    assert update_response.status_code == 200
    assert update_response.json()["full_name"] == "Nombre Actualizado"
    assert update_response.json()["grave_number"] == "N-15"
    assert client.get(f"/api/deceased/{created['id']}").json()["known_as"] == "Apodo de prueba"
    assert client.put(f"/api/deceased/{created['id']}", json={**updated, "known_as": " "}).json()["known_as"] is None

    listing = client.get("/api/deceased", params={"search": "Actualizado", "page": 1, "page_size": 10})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["id"] == created["id"]


def test_pagination_shared_location_and_search_literals(client: TestClient) -> None:
    authenticate(client)
    base = {
        'date_of_death': '2020-05-15', 'burial_date': '2020-05-17',
        'sector': 'A', 'grave_number': 'Compartida',
    }
    for name in ['Ana', 'Beatriz', 'Nombre % literal']:
        response = client.post('/api/deceased', json={**base, 'full_name': name})
        assert response.status_code == 201
    page = client.get('/api/deceased', params={'page': 2, 'page_size': 1}).json()
    assert page['total'] == 3
    assert len(page['items']) == 1
    assert page['items'][0]['full_name'] == 'Beatriz'
    literal = client.get('/api/deceased', params={'search': '%'}).json()
    assert literal['total'] == 1
    assert literal['items'][0]['full_name'] == 'Nombre % literal'
    assert client.get('/api/deceased/no-existe').status_code == 404
    assert client.put('/api/deceased/no-existe', json={**base, 'full_name': 'Ana'}).status_code == 404


def test_forged_and_expired_sessions_are_rejected(client: TestClient) -> None:
    from datetime import datetime, timedelta, timezone
    import jwt
    from app.core.config import settings
    from app.dependencies import SESSION_COOKIE
    client.cookies.set(SESSION_COOKIE, 'token-inventado')
    assert client.get('/api/deceased').status_code == 401
    expired = jwt.encode({'sub': 'admin', 'exp': datetime.now(timezone.utc) - timedelta(minutes=1)}, settings.jwt_secret, algorithm='HS256')
    client.cookies.set(SESSION_COOKIE, expired)
    assert client.get('/api/auth/me').status_code == 401
