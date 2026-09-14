from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.assessment import Assessment, Question
from app.models.user import User
from app.schemas.assessment import AssessmentCreate, AssessmentUpdate, AssessmentResponse
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/assessments", tags=["Assessments"])


@router.get("", response_model=List[AssessmentResponse])
def list_assessments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all available assessments."""
    assessments = db.query(Assessment).order_by(Assessment.created_at.desc()).all()
    return assessments


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment_in: AssessmentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Create a new coding assessment with questions (Admin only)."""
    assessment = Assessment(
        title=assessment_in.title,
        description=assessment_in.description,
        duration=assessment_in.duration,
        difficulty=assessment_in.difficulty,
        created_by=admin.id
    )
    db.add(assessment)
    db.flush()

    if assessment_in.questions:
        for q in assessment_in.questions:
            question = Question(
                assessment_id=assessment.id,
                title=q.title,
                description=q.description,
                starter_code=q.starter_code,
                language=q.language,
                time_limit=q.time_limit
            )
            db.add(question)

    db.commit()
    db.refresh(assessment)
    return assessment


@router.get("/{id}", response_model=AssessmentResponse)
def get_assessment(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get single assessment with questions."""
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return assessment


@router.put("/{id}", response_model=AssessmentResponse)
def update_assessment(
    id: int,
    assessment_in: AssessmentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update assessment details (Admin only)."""
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if assessment_in.title is not None:
        assessment.title = assessment_in.title
    if assessment_in.description is not None:
        assessment.description = assessment_in.description
    if assessment_in.duration is not None:
        assessment.duration = assessment_in.duration
    if assessment_in.difficulty is not None:
        assessment.difficulty = assessment_in.difficulty

    db.commit()
    db.refresh(assessment)
    return assessment


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete an assessment (Admin only)."""
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    db.delete(assessment)
    db.commit()
    return None
