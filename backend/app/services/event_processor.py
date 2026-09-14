import json
import datetime
import logging
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.session import AssessmentSession, Event
from app.schemas.event import EventCreate
from app.services.risk_engine import risk_engine
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)


class EventProcessor:
    """
    Processes incoming assessment-session events in real time.
    Updates database records, recalculates risk scores, and broadcasts
    to candidate and admin WebSockets.
    """

    @staticmethod
    def classify_event(event_type: str, metadata: Dict[str, Any]) -> Tuple[str, float]:
        """
        Determine severity and individual score contribution for an event.
        Severity: LOW, MEDIUM, HIGH
        """
        event_type = event_type.upper()
        severity = "LOW"
        contribution = 0.0

        if event_type == "TAB_SWITCH":
            duration = float(metadata.get("duration", 0.0))
            if duration >= 10.0:
                severity = "HIGH"
                contribution = 10.0
            elif duration >= 4.0:
                severity = "MEDIUM"
                contribution = 7.0
            else:
                severity = "LOW"
                contribution = 4.0

        elif event_type in ("WINDOW_BLUR", "FOCUS_LOSS"):
            duration = float(metadata.get("duration", 0.0))
            if duration >= 15.0:
                severity = "HIGH"
                contribution = 8.0
            elif duration >= 5.0:
                severity = "MEDIUM"
                contribution = 5.0
            else:
                severity = "LOW"
                contribution = 2.0

        elif event_type == "PASTE":
            char_count = int(metadata.get("character_count", 0))
            if char_count > 300:
                severity = "HIGH"
                contribution = 12.0
            elif char_count >= 50:
                severity = "MEDIUM"
                contribution = 5.0
            else:
                severity = "LOW"
                contribution = 1.0

        elif event_type == "TYPING_BURST":
            rate = float(metadata.get("characters_per_second", 0.0))
            if rate > 20.0:
                severity = "HIGH"
                contribution = 10.0
            else:
                severity = "MEDIUM"
                contribution = 4.0

        elif event_type == "INACTIVITY":
            duration = float(metadata.get("duration", 0.0))
            if duration > 120.0:
                severity = "MEDIUM"
                contribution = 5.0
            else:
                severity = "LOW"
                contribution = 1.0

        elif event_type == "HIGH_CODE_SIMILARITY":
            similarity = float(metadata.get("similarity_score", 0.0))
            if similarity >= 0.85:
                severity = "HIGH"
                contribution = 25.0
            else:
                severity = "MEDIUM"
                contribution = 15.0

        return severity, contribution

    @classmethod
    async def process_event(cls, db: Session, event_data: EventCreate) -> Event:
        """
        Validates, saves the event, updates session aggregates,
        recalculates risk score, and triggers WebSocket broadcasts.
        """
        session = db.query(AssessmentSession).filter(AssessmentSession.id == event_data.session_id).first()
        if not session:
            raise ValueError(f"Session {event_data.session_id} not found")

        meta = event_data.metadata or {}
        severity, contribution = cls.classify_event(event_data.event_type, meta)

        event_timestamp = event_data.timestamp or datetime.datetime.utcnow()
        new_event = Event(
            session_id=session.id,
            event_type=event_data.event_type.upper(),
            timestamp=event_timestamp,
            severity=severity,
            score_contribution=contribution,
            metadata_json=json.dumps(meta)
        )
        db.add(new_event)

        # Update running aggregates on session
        ev_type = event_data.event_type.upper()
        if ev_type == "TAB_SWITCH":
            session.tab_switch_count += 1
            duration = float(meta.get("duration", 0.0))
            session.total_hidden_duration += duration

        elif ev_type in ("WINDOW_BLUR", "FOCUS_LOSS"):
            session.blur_count += 1
            duration = float(meta.get("duration", 0.0))
            session.total_blur_duration += duration

        elif ev_type == "PASTE":
            session.paste_count += 1
            char_count = int(meta.get("character_count", 0))
            if char_count > 300:
                session.large_paste_count += 1

        elif ev_type == "CODE_SIMILARITY":
            sim = float(meta.get("similarity_score", 0.0))
            if sim > session.code_similarity_max:
                session.code_similarity_max = sim

        # Build feature dictionary for risk engine
        now = datetime.datetime.utcnow()
        session_duration = (now - session.started_at).total_seconds()
        
        # Check long tab switches
        long_switches = db.query(Event).filter(
            Event.session_id == session.id,
            Event.event_type == "TAB_SWITCH",
            Event.severity.in_(["MEDIUM", "HIGH"])
        ).count()

        metrics = {
            "tab_switch_count": session.tab_switch_count,
            "total_hidden_duration": session.total_hidden_duration,
            "long_tab_switch_count": long_switches,
            "blur_count": session.blur_count,
            "total_blur_duration": session.total_blur_duration,
            "paste_count": session.paste_count,
            "large_paste_count": session.large_paste_count,
            "characters_typed": meta.get("characters_typed", 0),
            "characters_deleted": meta.get("characters_deleted", 0),
            "paste_characters": meta.get("paste_characters", 0),
            "inactivity_duration_s": meta.get("inactivity_duration", 0.0),
            "session_duration_s": max(30.0, session_duration),
            "code_similarity_max": session.code_similarity_max,
        }

        # Calculate new risk score and explainable reasons
        score, level, reasons, anomaly_score = risk_engine.calculate_session_risk(metrics)
        session.risk_score = score
        session.risk_level = level
        session.risk_reasons = json.dumps(reasons)
        session.behavior_anomaly_score = anomaly_score

        db.commit()
        db.refresh(new_event)
        db.refresh(session)

        # Notify candidate session over WebSocket
        await ws_manager.send_session_message(session.id, {
            "type": "EVENT_ACK",
            "event_id": new_event.id,
            "event_type": new_event.event_type,
            "current_risk_score": session.risk_score,
            "risk_level": session.risk_level
        })

        # Broadcast live update to all Admin dashboards
        await ws_manager.broadcast_to_admins({
            "type": "LIVE_EVENT",
            "event": {
                "id": new_event.id,
                "session_id": session.id,
                "candidate_name": session.candidate.name if session.candidate else "Candidate",
                "assessment_title": session.assessment.title if session.assessment else "Assessment",
                "event_type": new_event.event_type,
                "severity": new_event.severity,
                "score_contribution": new_event.score_contribution,
                "timestamp": new_event.timestamp.isoformat(),
                "metadata": meta
            },
            "session": {
                "id": session.id,
                "candidate_name": session.candidate.name if session.candidate else "Candidate",
                "assessment_title": session.assessment.title if session.assessment else "Assessment",
                "risk_score": session.risk_score,
                "risk_level": session.risk_level,
                "status": session.status,
                "tab_switch_count": session.tab_switch_count,
                "paste_count": session.paste_count,
                "large_paste_count": session.large_paste_count,
                "code_similarity_max": session.code_similarity_max,
                "risk_reasons": reasons,
                "latest_event": new_event.event_type
            }
        })

        return new_event


event_processor = EventProcessor()
