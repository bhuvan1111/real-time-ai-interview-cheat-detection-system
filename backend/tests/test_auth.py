def test_register_candidate(client):
    res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!",
        "role": "candidate"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@example.com"
    assert data["user"]["role"] == "candidate"


def test_register_duplicate_email(client, candidate_user):
    res = client.post("/api/auth/register", json={
        "name": "Duplicate",
        "email": candidate_user.email,
        "password": "Password123!"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_login_success(client, candidate_user):
    res = client.post("/api/auth/login", json={
        "email": candidate_user.email,
        "password": "CandSecret123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == candidate_user.email


def test_login_invalid_password(client, candidate_user):
    res = client.post("/api/auth/login", json={
        "email": candidate_user.email,
        "password": "WrongPassword!"
    })
    assert res.status_code == 401


def test_get_me(client, candidate_user, candidate_token):
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {candidate_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == candidate_user.email


def test_get_me_unauthorized(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
