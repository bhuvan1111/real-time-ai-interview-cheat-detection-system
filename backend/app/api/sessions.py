import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import AssessmentSession, Event
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.session import SessionStart, SessionFinish, SessionResponse
from app.schemas.event import EventResponse
from app.schemas.assessment import AssessmentResponse
from app.schemas.auth import UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


def format_session_response(session: AssessmentSession, include_events: bool = True) -> SessionResponse:
    try:
        reasons = json.loads(session.risk_reasons) if session.risk_reasons else []
    except Exception:
        reasons = []

    events_out = []
    if include_events and session.events:
        for ev in session.events[-50:]:  # Last 50 events
            try:
                meta = json.loads(ev.metadata_json) if ev.metadata_json else {}
            except Exception:
                meta = {}
            events_out.append(EventResponse(
                id=ev.id,
                session_id=ev.session_id,
                event_type=ev.event_type,
                timestamp=ev.timestamp,
                severity=ev.severity,
                score_contribution=ev.score_contribution,
                metadata=meta
            ))

    candidate_out = UserResponse.model_validate(session.candidate) if session.candidate else None
    assessment_out = AssessmentResponse.model_validate(session.assessment) if session.assessment else None

    return SessionResponse(
        id=session.id,
        candidate_id=session.candidate_id,
        assessment_id=session.assessment_id,
        started_at=session.started_at,
        ended_at=session.ended_at,
        status=session.status,
        risk_score=session.risk_score,
        risk_level=session.risk_level,
        behavior_anomaly_score=session.behavior_anomaly_score,
        risk_reasons=reasons,
        tab_switch_count=session.tab_switch_count,
        total_hidden_duration=session.total_hidden_duration,
        paste_count=session.paste_count,
        large_paste_count=session.large_paste_count,
        blur_count=session.blur_count,
        total_blur_duration=session.total_blur_duration,
        code_similarity_max=session.code_similarity_max,
        candidate=candidate_out,
        assessment=assessment_out,
        recent_events=events_out
    )


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    session_in: SessionStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start an assessment session for current candidate."""
    assessment = db.query(Assessment).filter(Assessment.id == session_in.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    # Check if active session already exists
    existing = db.query(AssessmentSession).filter(
        AssessmentSession.candidate_id == current_user.id,
        AssessmentSession.assessment_id == session_in.assessment_id,
        AssessmentSession.status == "active"
    ).first()

    if existing:
        return format_session_response(existing)

    new_session = AssessmentSession(
        candidate_id=current_user.id,
        assessment_id=session_in.assessment_id,
        started_at=datetime.datetime.utcnow(),
        status="active",
        risk_score=0.0,
        risk_level="LOW",
        risk_reasons=json.dumps(["Assessment session started. Activity is within normal parameters."])
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Initial start event
    start_event = Event(
        session_id=new_session.id,
        event_type="SESSION_START",
        timestamp=datetime.datetime.utcnow(),
        severity="LOW",
        score_contribution=0.0,
        metadata_json=json.dumps({"message": "Assessment session initiated by candidate."})
    )
    db.add(start_event)
    db.commit()

    return format_session_response(new_session)


@router.get("", response_model=List[SessionResponse])
def list_sessions(
    status_filter: Optional[str] = Query(None, alias="status"),
    assessment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List sessions. Candidates see their own sessions; Admins see all."""
    query = db.query(AssessmentSession)

    if current_user.role != "admin":
        query = query.filter(AssessmentSession.candidate_id == current_user.id)
    
    if status_filter:
        query = query.filter(AssessmentSession.status == status_filter)
    if assessment_id:
        query = query.filter(AssessmentSession.assessment_id == assessment_id)

    sessions = query.order_by(AssessmentSession.started_at.desc()).all()
    return [format_session_response(s, include_events=False) for s in sessions]


@router.get("/{id}", response_model=SessionResponse)
def get_session(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve full details of an assessment session including recent events and risk explanations."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role != "admin" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return format_session_response(session, include_events=True)


@router.post("/{id}/finish", response_model=SessionResponse)
def finish_session(
    id: int,
    finish_in: SessionFinish,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete and finish an assessment session."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role != "admin" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    session.ended_at = datetime.datetime.utcnow()
    session.status = finish_in.status or "completed"

    finish_event = Event(
        session_id=session.id,
        event_type="SESSION_FINISH",
        timestamp=datetime.datetime.utcnow(),
        severity="LOW",
        score_contribution=0.0,
        metadata_json=json.dumps({"final_risk_score": session.risk_score, "risk_level": session.risk_level})
    )
    db.add(finish_event)
    db.commit()
    db.refresh(session)

    return format_session_response(session)
