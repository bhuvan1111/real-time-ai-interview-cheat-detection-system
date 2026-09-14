from app.models.assessment import Assessment
from app.models.session import AssessmentSession


def test_event_ingestion_and_risk_update(client, db_session, candidate_token, candidate_user):
    assessment = Assessment(title="Event Test Assessment", duration=30, difficulty="Easy")
    db_session.add(assessment)
    db_session.commit()

    session = AssessmentSession(
        candidate_id=candidate_user.id,
        assessment_id=assessment.id,
        status="active"
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    # Ingest TAB_SWITCH event
    tab_res = client.post(
        "/api/events",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={
            "session_id": session.id,
            "event_type": "TAB_SWITCH",
            "metadata": {"duration": 6.5}
        }
    )
    assert tab_res.status_code == 201
    assert tab_res.json()["severity"] == "MEDIUM"

    # Ingest large PASTE event (>300 chars)
    paste_res = client.post(
        "/api/events",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={
            "session_id": session.id,
            "event_type": "PASTE",
            "metadata": {"character_count": 450}
        }
    )
    assert paste_res.status_code == 201
    assert paste_res.json()["severity"] == "HIGH"

    # Check updated session risk
    sess_res = client.get(f"/api/sessions/{session.id}", headers={"Authorization": f"Bearer {candidate_token}"})
    updated_sess = sess_res.json()
    assert updated_sess["tab_switch_count"] == 1
    assert updated_sess["paste_count"] == 1
    assert updated_sess["large_paste_count"] == 1
    assert updated_sess["risk_score"] > 0.0

    # Check event timeline
    events_res = client.get(f"/api/sessions/{session.id}/events", headers={"Authorization": f"Bearer {candidate_token}"})
    assert events_res.status_code == 200
    assert len(events_res.json()) >= 2
