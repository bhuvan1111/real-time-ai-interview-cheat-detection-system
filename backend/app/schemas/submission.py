import datetime
from typing import Optional
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    session_id: int
    question_id: int
    code: str
    language: str = "python"


class SubmissionResponse(BaseModel):
    id: int
    session_id: int
    question_id: int
    code: str
    language: str
    submitted_at: datetime.datetime

    class Config:
        from_attributes = True


class CodeRunRequest(BaseModel):
    code: str
    language: str = "python"
    input_data: Optional[str] = ""


class CodeRunResponse(BaseModel):
    output: str
    error: Optional[str] = None
    execution_time_ms: float
