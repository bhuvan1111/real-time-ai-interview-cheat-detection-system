from app.models.assessment import Assessment


def test_session_lifecycle(client, db_session, candidate_token, candidate_user):
    # Setup assessment
    assessment = Assessment(title="Sample Assessment", duration=30, difficulty="Easy")
    db_session.add(assessment)
    db_session.commit()
    db_session.refresh(assessment)

    # 1. Start Session
    start_res = client.post(
        "/api/sessions",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={"assessment_id": assessment.id}
    )
    assert start_res.status_code == 201
    session_data = start_res.json()
    session_id = session_data["id"]
    assert session_data["status"] == "active"
    assert session_data["risk_score"] == 0.0

    # 2. Get Session Details
    get_res = client.get(f"/api/sessions/{session_id}", headers={"Authorization": f"Bearer {candidate_token}"})
    assert get_res.status_code == 200
    assert len(get_res.json()["risk_reasons"]) > 0

    # 3. Finish Session
    finish_res = client.post(
        f"/api/sessions/{session_id}/finish",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={"status": "completed"}
    )
    assert finish_res.status_code == 200
    assert finish_res.json()["status"] == "completed"
