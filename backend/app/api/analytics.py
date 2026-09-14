import json
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.session import AssessmentSession, Event
from app.models.user import User
from app.models.assessment import Assessment
from app.schemas.analytics import AnalyticsOverview, SessionAnalyticsDetail, RiskTimelinePoint
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Summary KPI metrics for the Admin dashboard."""
    total_candidates = db.query(User).filter(User.role == "candidate").count()
    active_sessions = db.query(AssessmentSession).filter(AssessmentSession.status == "active").count()
    suspicious_sessions = db.query(AssessmentSession).filter(AssessmentSession.risk_score >= 50.0).count()
    critical_risk_sessions = db.query(AssessmentSession).filter(AssessmentSession.risk_score >= 75.0).count()
    
    avg_score_res = db.query(func.avg(AssessmentSession.risk_score)).scalar()
    average_risk_score = round(float(avg_score_res), 1) if avg_score_res is not None else 0.0

    total_events = db.query(Event).count()

    # Risk level distribution
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    sessions = db.query(AssessmentSession.risk_level).all()
    for s in sessions:
        lvl = s[0].upper() if s[0] else "LOW"
        if lvl in risk_counts:
            risk_counts[lvl] += 1

    # Event types distribution
    event_counts: Dict[str, int] = {}
    ev_types = db.query(Event.event_type, func.count(Event.id)).group_by(Event.event_type).all()
    for etype, count in ev_types:
        event_counts[etype] = count

    return AnalyticsOverview(
        total_candidates=total_candidates,
        active_sessions=active_sessions,
        suspicious_sessions=suspicious_sessions,
        critical_risk_sessions=critical_risk_sessions,
        average_risk_score=average_risk_score,
        total_events_processed=total_events,
        risk_level_counts=risk_counts,
        event_type_counts=event_counts
    )


@router.get("/session/{session_id}", response_model=SessionAnalyticsDetail)
def get_session_analytics(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detailed analytics and risk progression timeline for a specific candidate session."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    events = db.query(Event).filter(Event.session_id == session_id).order_by(Event.timestamp.asc()).all()

    running_score = 0.0
    timeline: List[RiskTimelinePoint] = []
    typing_edits = 0

    for ev in events:
        running_score = min(100.0, running_score + ev.score_contribution)
        if ev.event_type == "TYPING_UPDATE":
            typing_edits += 1

        timeline.append(RiskTimelinePoint(
            timestamp=ev.timestamp.strftime("%H:%M:%S"),
            risk_score=round(running_score, 1),
            event_type=ev.event_type
        ))

    cand_name = session.candidate.name if session.candidate else "Candidate"
    return SessionAnalyticsDetail(
        session_id=session.id,
        candidate_name=cand_name,
        risk_score=session.risk_score,
        risk_level=session.risk_level,
        total_events=len(events),
        tab_switches=session.tab_switch_count,
        large_pastes=session.large_paste_count,
        typing_edits=typing_edits,
        max_similarity=session.code_similarity_max,
        anomaly_score=session.behavior_anomaly_score,
        timeline_risk=timeline
    )
