import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    session_id: int
    event_type: str = Field(..., description="TAB_SWITCH, WINDOW_BLUR, WINDOW_FOCUS, PASTE, TYPING_UPDATE, etc.")
    timestamp: Optional[datetime.datetime] = None
    severity: Optional[str] = "LOW"
    score_contribution: Optional[float] = 0.0
    metadata: Optional[Dict[str, Any]] = {}


class EventResponse(BaseModel):
    id: int
    session_id: int
    event_type: str
    timestamp: datetime.datetime
    severity: str
    score_contribution: float
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True
