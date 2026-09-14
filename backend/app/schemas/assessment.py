import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class QuestionBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str
    starter_code: str = ""
    language: str = "python"
    time_limit: int = 30


class QuestionCreate(QuestionBase):
    assessment_id: Optional[int] = None


class QuestionResponse(QuestionBase):
    id: int
    assessment_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    duration: int = 60
    difficulty: str = "Medium"


class AssessmentCreate(AssessmentBase):
    questions: Optional[List[QuestionBase]] = []


class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    difficulty: Optional[str] = None


class AssessmentResponse(AssessmentBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    questions: List[QuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)
