import json
from tests.test_api import authenticate


def test_roles_audit_and_deleted_record_snapshot(client):
    assert client.get('/api/users').status_code == 401
    authenticate(client)
    admin_cookie = client.cookies.get('bernabela_session')
    operator = {'full_name': 'Operador de prueba', 'username': 'operator-test', 'role': 'operator', 'is_active': True, 'password': 'secret-operator-123'}
    created = client.post('/api/users', json=operator)
    assert created.status_code == 201
    assert 'password' not in created.json()
    assert client.post('/api/users', json=operator).status_code == 409
    client.cookies.clear()
    assert client.post('/api/auth/login', json={'username': operator['username'], 'password': operator['password']}).status_code == 200
    for endpoint in ['/api/users', '/api/audit']:
        assert client.get(endpoint).status_code == 403
    assert client.post('/api/users', json=operator).status_code == 403
    payload = {'full_name': 'Difunto ficticio', 'date_of_death': '2020-05-15', 'burial_date': '2020-05-17', 'sector': 'A'}
    record = client.post('/api/deceased', json=payload).json()
    assert client.delete(f"/api/deceased/{record['id']}").status_code == 403
    assert client.put(f"/api/deceased/{record['id']}", json={**payload, 'known_as': 'CC de prueba'}).status_code == 200
    client.cookies.clear(); client.cookies.set('bernabela_session', admin_cookie)
    assert client.delete(f"/api/deceased/{record['id']}").status_code == 204
    audit = client.get('/api/audit').json()
    assert audit['total'] == 4
    deleted = next(item for item in audit['items'] if item['action'] == 'deceased.delete')
    assert deleted['before']['known_as'] == 'CC de prueba'
    edited = next(item for item in audit['items'] if item['action'] == 'deceased.update')
    assert edited['actor_username'] == 'operator-test'
    assert edited['before']['known_as'] is None
    assert 'secret-operator-123' not in json.dumps(audit)
    assert 'password_hash' not in json.dumps(audit)
    assert client.get('/api/audit', params={'actor':'operator-test'}).json()['total'] == 2
    assert client.get('/api/audit', params={'action':'deceased.delete'}).json()['total'] == 1
    assert client.get('/api/audit', params={'start_date':'2099-01-01'}).json()['total'] == 0


def test_deactivation_password_reset_and_self_protection(client):
    authenticate(client)
    manager = client.get('/api/auth/me').json()
    manager_cookie = client.cookies.get('bernabela_session')
    assert client.put(f"/api/users/{manager['id']}", json={**manager, 'full_name':'Administrador', 'is_active':False}).status_code == 400
    assert client.put(f"/api/users/{manager['id']}", json={**manager, 'full_name':'Administrador', 'role':'operator'}).status_code == 400
    data = {'full_name':'Prueba', 'username':'operator-test', 'role':'operator', 'is_active':True}
    operator = client.post('/api/users', json={**data, 'password':'old-password-123'}).json()
    client.cookies.clear()
    client.post('/api/auth/login', json={'username':'operator-test', 'password':'old-password-123'})
    old_cookie = client.cookies.get('bernabela_session')
    client.cookies.clear(); client.cookies.set('bernabela_session', manager_cookie)
    assert client.put(f"/api/users/{operator['id']}/password", json={'password':'new-password-123'}).status_code == 204
    client.cookies.clear(); client.cookies.set('bernabela_session', old_cookie)
    assert client.get('/api/auth/me').status_code == 401
    client.cookies.clear()
    assert client.post('/api/auth/login', json={'username':'operator-test', 'password':'old-password-123'}).status_code == 401
    assert client.post('/api/auth/login', json={'username':'operator-test', 'password':'new-password-123'}).status_code == 200
    client.cookies.clear(); client.cookies.set('bernabela_session', manager_cookie)
    assert client.put(f"/api/users/{operator['id']}", json={**data, 'is_active':False}).status_code == 200
    client.cookies.clear()
    assert client.post('/api/auth/login', json={'username':'operator-test', 'password':'new-password-123'}).status_code == 401
    client.cookies.set('bernabela_session', manager_cookie)
    assert client.put('/api/users/me/password', json={'current_password':'wrong', 'password':'different-password-123'}).status_code == 400
    assert client.put('/api/users/me/password', json={'current_password':'test-password-123', 'password':'different-password-123'}).status_code == 204
    assert client.get('/api/auth/me').status_code == 401
