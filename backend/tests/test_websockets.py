import json
from app.models.assessment import Assessment
from app.models.session import AssessmentSession


def test_session_websocket_lifecycle(client, db_session, candidate_user, candidate_token):
    assessment = Assessment(title="WS Test Assessment", duration=30, difficulty="Easy")
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

    with client.websocket_connect(f"/ws/session/{session.id}?token={candidate_token}") as websocket:
        # Initial greeting message
        welcome = websocket.receive_json()
        assert welcome["type"] == "CONNECTION_ESTABLISHED"
        assert welcome["session_id"] == session.id

        # Send TAB_SWITCH event
        websocket.send_json({
            "type": "EVENT",
            "event_type": "TAB_SWITCH",
            "metadata": {"duration": 4.5}
        })

        # Receive ACK
        ack = websocket.receive_json()
        assert ack["type"] == "EVENT_ACK"
        assert ack["event_type"] == "TAB_SWITCH"
        assert "current_risk_score" in ack


def test_admin_websocket_connection(client, admin_token):
    with client.websocket_connect(f"/ws/admin?token={admin_token}") as websocket:
        welcome = websocket.receive_json()
        assert welcome["type"] == "ADMIN_CONNECTED"
