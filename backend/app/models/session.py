import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AssessmentSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, completed, flagged
    risk_score = Column(Float, default=0.0, nullable=False)  # 0 to 100
    risk_level = Column(String(50), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    behavior_anomaly_score = Column(Float, default=0.0, nullable=False)
    risk_reasons = Column(Text, default="[]", nullable=False)  # JSON serialized list of explanations
    
    # Aggregated metrics for fast lookups
    tab_switch_count = Column(Integer, default=0, nullable=False)
    total_hidden_duration = Column(Float, default=0.0, nullable=False)
    paste_count = Column(Integer, default=0, nullable=False)
    large_paste_count = Column(Integer, default=0, nullable=False)
    blur_count = Column(Integer, default=0, nullable=False)
    total_blur_duration = Column(Float, default=0.0, nullable=False)
    code_similarity_max = Column(Float, default=0.0, nullable=False)

    # Relationships
    candidate = relationship("User", back_populates="sessions")
    assessment = relationship("Assessment", back_populates="sessions")
    events = relationship("Event", back_populates="session", cascade="all, delete-orphan", order_by="Event.timestamp")
    submissions = relationship("Submission", back_populates="session", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # TAB_SWITCH, WINDOW_BLUR, WINDOW_FOCUS, PASTE, TYPING_UPDATE, etc.
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    severity = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH
    score_contribution = Column(Float, default=0.0, nullable=False)
    metadata_json = Column(Text, default="{}", nullable=False)  # JSON metadata (e.g. duration, character_count, etc.)

    # Relationships
    session = relationship("AssessmentSession", back_populates="events")
