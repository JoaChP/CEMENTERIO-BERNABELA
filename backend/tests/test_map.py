from tests.test_api import authenticate


def test_optional_grave_number_and_persistent_map_position(client):
    assert client.get('/api/deceased/map/records').status_code == 401
    authenticate(client)
    payload = {'full_name': 'Registro ficticio del plano', 'date_of_death': '2020-05-15', 'burial_date': '2020-05-17', 'sector': 'Sector B'}
    created = client.post('/api/deceased', json=payload)
    assert created.status_code == 201
    record = created.json()
    assert record['grave_number'] is None
    assert record['map_x'] is None
    updated = client.put(f"/api/deceased/{record['id']}", json={**payload, 'grave_number': '  ', 'map_x': 85.3, 'map_y': 42.1})
    assert updated.status_code == 200
    assert updated.json()['grave_number'] is None
    assert client.get('/api/deceased/map/records').json()[0]['map_x'] == 85.3
    assert client.get(f"/api/deceased/{record['id']}").json()['map_y'] == 42.1
    assert client.get('/api/deceased/export/pdf').status_code == 200
    assert client.put(f"/api/deceased/{record['id']}", json=payload).json()['map_x'] is None


def test_map_coordinates_validated(client):
    authenticate(client)
    base = {'full_name': 'Prueba', 'date_of_death': '2020-05-15', 'burial_date': '2020-05-17', 'sector': 'A'}
    for point in [{'map_x': 50}, {'map_x': -1, 'map_y': 20}, {'map_x': 30, 'map_y': 101}]:
        assert client.post('/api/deceased', json={**base, **point}).status_code == 422
