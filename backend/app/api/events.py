import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import AssessmentSession, Event
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse
from app.services.event_processor import event_processor
from app.api.deps import get_current_user

router = APIRouter(tags=["Events"])


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingest a candidate monitoring event (REST endpoint).
    Processes event, updates risk score, and broadcasts to admin.
    """
    session = db.query(AssessmentSession).filter(AssessmentSession.id == event_in.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role != "admin" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_event = await event_processor.process_event(db, event_in)
    
    try:
        meta = json.loads(new_event.metadata_json) if new_event.metadata_json else {}
    except Exception:
        meta = {}

    return EventResponse(
        id=new_event.id,
        session_id=new_event.session_id,
        event_type=new_event.event_type,
        timestamp=new_event.timestamp,
        severity=new_event.severity,
        score_contribution=new_event.score_contribution,
        metadata=meta
    )


@router.get("/sessions/{session_id}/events", response_model=List[EventResponse])
def get_session_events(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full chronological timeline of events for an assessment session."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role != "admin" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    events = db.query(Event).filter(Event.session_id == session_id).order_by(Event.timestamp.asc()).all()
    results = []
    for ev in events:
        try:
            meta = json.loads(ev.metadata_json) if ev.metadata_json else {}
        except Exception:
            meta = {}
        results.append(EventResponse(
            id=ev.id,
            session_id=ev.session_id,
            event_type=ev.event_type,
            timestamp=ev.timestamp,
            severity=ev.severity,
            score_contribution=ev.score_contribution,
            metadata=meta
        ))
    return results
