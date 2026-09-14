import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    code = Column(Text, nullable=False)
    language = Column(String(50), default="python", nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("AssessmentSession", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")
    similarity_targets = relationship("SimilarityResult", foreign_keys="[SimilarityResult.submission_id]", back_populates="submission", cascade="all, delete-orphan")


class SimilarityResult(Base):
    __tablename__ = "similarity_results"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    compared_submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    similarity_score = Column(Float, nullable=False)  # 0.0 to 1.0
    method = Column(String(100), default="AST + token similarity", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    submission = relationship("Submission", foreign_keys=[submission_id], back_populates="similarity_targets")
    compared_submission = relationship("Submission", foreign_keys=[compared_submission_id])
