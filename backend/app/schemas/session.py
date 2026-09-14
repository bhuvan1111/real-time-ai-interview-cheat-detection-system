import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.event import EventResponse
from app.schemas.assessment import AssessmentResponse
from app.schemas.auth import UserResponse


class SessionStart(BaseModel):
    assessment_id: int


class SessionFinish(BaseModel):
    status: Optional[str] = "completed"


class SessionResponse(BaseModel):
    id: int
    candidate_id: int
    assessment_id: int
    started_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    status: str
    risk_score: float
    risk_level: str
    behavior_anomaly_score: float
    risk_reasons: List[str] = []
    
    # Aggregated metrics
    tab_switch_count: int = 0
    total_hidden_duration: float = 0.0
    paste_count: int = 0
    large_paste_count: int = 0
    blur_count: int = 0
    total_blur_duration: float = 0.0
    code_similarity_max: float = 0.0

    # Optional nested details
    candidate: Optional[UserResponse] = None
    assessment: Optional[AssessmentResponse] = None
    recent_events: Optional[List[EventResponse]] = []

    class Config:
        from_attributes = True
