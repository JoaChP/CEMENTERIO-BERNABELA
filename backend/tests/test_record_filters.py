from app.routers import deceased
from tests.test_api import authenticate


def test_combined_filters_optional_birth_and_pdf_all_pages(client, monkeypatch):
    authenticate(client)
    base = {"full_name": "Ana Apellido Prueba", "date_of_death": "2020-05-15", "burial_date": "2020-05-17", "sector": "Sector A", "row": "Fila 2", "grave_number": "N-14"}
    for index in range(12):
        created = client.post('/api/deceased', json={**base, "known_as": f"CC {index}"})
        assert created.status_code == 201
        assert created.json()['date_of_birth'] is None
    assert client.post('/api/deceased', json={**base, "full_name": "Beatriz Diferente", "date_of_birth": "1940-02-10", "sector": "Sector B", "grave_number": "N-15"}).status_code == 201
    filters = {"search": "apellido ana", "date_of_death": "2020-05-15", "burial_date": "2020-05-17", "location": "A N-14"}
    result = client.get('/api/deceased', params={**filters, "page_size": 10}).json()
    assert result['total'] == 12
    assert len(result['items']) == 10
    assert client.get('/api/deceased', params={"date_of_birth": "1940-02-10"}).json()['total'] == 1
    assert client.get('/api/deceased', params={**filters, "date_of_birth": "1940-02-10"}).json()['total'] == 0
    assert client.get('/api/deceased', params={"search": "cc 11"}).json()['total'] == 1
    assert client.get('/api/deceased', params={"date_of_birth": "invalid"}).status_code == 422
    captured = []
    original = deceased.build_records_pdf
    def capture(records, applied):
        captured.append([record.full_name for record in records])
        return original(records, applied)
    monkeypatch.setattr(deceased, 'build_records_pdf', capture)
    response = client.get('/api/deceased/export/pdf', params=filters)
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/pdf'
    assert response.content.startswith(b'%PDF-')
    assert len(captured[-1]) == 12
    assert 'Beatriz Diferente' not in captured[-1]
    assert client.get('/api/deceased/export/pdf').status_code == 200
    assert len(captured[-1]) == 13
    assert client.get('/api/deceased/export/pdf', params={'search': 'sin coincidencias'}).status_code == 200
    assert captured[-1] == []


def test_pdf_export_requires_session(client):
    assert client.get('/api/deceased/export/pdf').status_code == 401
