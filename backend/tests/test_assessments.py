def test_admin_create_assessment(client, admin_token):
    res = client.post(
        "/api/assessments",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "title": "Python Data Structures",
            "description": "Arrays and Stacks test",
            "duration": 45,
            "difficulty": "Medium",
            "questions": [
                {
                    "title": "Stack implementation",
                    "description": "Implement MinStack",
                    "starter_code": "class MinStack:\n    pass",
                    "language": "python",
                    "time_limit": 20
                }
            ]
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Python Data Structures"
    assert len(data["questions"]) == 1


def test_candidate_cannot_create_assessment(client, candidate_token):
    res = client.post(
        "/api/assessments",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={"title": "Unauthorized Assessment"}
    )
    assert res.status_code == 403


def test_list_assessments(client, admin_token, candidate_token):
    # Admin creates one
    client.post(
        "/api/assessments",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"title": "Test Assessment 1"}
    )

    # Candidate lists assessments
    res = client.get("/api/assessments", headers={"Authorization": f"Bearer {candidate_token}"})
    assert res.status_code == 200
    assert len(res.json()) >= 1
