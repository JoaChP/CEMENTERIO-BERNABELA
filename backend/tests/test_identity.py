import httpx

from app.routers.identity import extract_names


def login(client):
    client.post("/api/auth/login", json={"username": "test-admin", "password": "test-password-123"})


def test_exact_identity_only_and_deduplication():
    record = {"cedula": "199990001", "firstname": "PERSONA", "lastname1": "PRUEBA", "lastname2": "EJEMPLO"}
    payload = {"results": [record, record, {**record, "cedula": "199990002"}], "nombre": "OTRO RESULTADO"}
    assert extract_names(payload, "199990001") == ["PERSONA PRUEBA EJEMPLO"]
    assert extract_names(payload, "199990003") == []


def test_lookup_protected_and_validated(client, monkeypatch):
    def no_network(*args, **kwargs):
        raise AssertionError("No request should reach GoMeta")
    monkeypatch.setattr("app.routers.identity.httpx.get", no_network)
    assert client.get("/api/identity?cedula=199990001").status_code == 401
    login(client)
    assert client.get("/api/identity?cedula=invalid").status_code == 422


def test_lookup_response_and_upstream_failure(client, monkeypatch):
    login(client)
    def mock_get(url, **kwargs):
        return httpx.Response(200, request=httpx.Request("GET", url), json={"cedula": "199990001", "tipoIdentificacion": "01", "nombre": "PERSONA DE PRUEBA"})
    monkeypatch.setattr("app.routers.identity.httpx.get", mock_get)
    response = client.get("/api/identity?cedula=199990001")
    assert response.status_code == 200
    assert response.json()["names"] == ["PERSONA DE PRUEBA"]
    def fail_get(*args, **kwargs):
        raise httpx.ConnectError("offline")
    monkeypatch.setattr("app.routers.identity.httpx.get", fail_get)
    assert client.get("/api/identity?cedula=199990001").status_code == 502
