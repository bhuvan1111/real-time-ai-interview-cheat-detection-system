from typing import List, Dict, Any
from pydantic import BaseModel


class AnalyticsOverview(BaseModel):
    total_candidates: int
    active_sessions: int
    suspicious_sessions: int  # risk >= 50
    critical_risk_sessions: int  # risk >= 75
    average_risk_score: float
    total_events_processed: int
    risk_level_counts: Dict[str, int]
    event_type_counts: Dict[str, int]


class RiskTimelinePoint(BaseModel):
    timestamp: str
    risk_score: float
    event_type: str


class SessionAnalyticsDetail(BaseModel):
    session_id: int
    candidate_name: str
    risk_score: float
    risk_level: str
    total_events: int
    tab_switches: int
    large_pastes: int
    typing_edits: int
    max_similarity: float
    anomaly_score: float
    timeline_risk: List[RiskTimelinePoint]
