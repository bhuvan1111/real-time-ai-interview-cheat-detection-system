from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.assessment import Question, Assessment
from app.models.user import User
from app.schemas.assessment import QuestionCreate, QuestionResponse
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Add a question to an assessment (Admin only)."""
    if not question_in.assessment_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="assessment_id is required")

    assessment = db.query(Assessment).filter(Assessment.id == question_in.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    question = Question(
        assessment_id=question_in.assessment_id,
        title=question_in.title,
        description=question_in.description,
        starter_code=question_in.starter_code,
        language=question_in.language,
        time_limit=question_in.time_limit
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/{id}", response_model=QuestionResponse)
def get_question(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve question details."""
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question
