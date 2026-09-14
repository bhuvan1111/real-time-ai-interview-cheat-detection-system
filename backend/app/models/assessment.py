import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, default=60, nullable=False)  # Duration in minutes
    difficulty = Column(String(50), default="Medium", nullable=False)  # Easy, Medium, Hard
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_assessments")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    sessions = relationship("AssessmentSession", back_populates="assessment", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    starter_code = Column(Text, default="", nullable=False)
    language = Column(String(50), default="python", nullable=False)
    time_limit = Column(Integer, default=30, nullable=False)  # in minutes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    submissions = relationship("Submission", back_populates="question", cascade="all, delete-orphan")
