import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import AssessmentSession
from app.models.submission import Submission, SimilarityResult
from app.models.assessment import Question
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionResponse, CodeRunRequest, CodeRunResponse
from app.schemas.event import EventCreate
from app.services.similarity import analyze_code_similarity
from app.services.event_processor import event_processor
from app.utils.code_runner import execute_code
from app.api.deps import get_current_user

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("/run", response_model=CodeRunResponse)
def run_candidate_code(
    run_req: CodeRunRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute candidate code in a sandbox environment and return output and runtime."""
    stdout, stderr, elapsed_ms = execute_code(
        code=run_req.code,
        language=run_req.language,
        input_data=run_req.input_data or ""
    )
    return CodeRunResponse(
        output=stdout,
        error=stderr if stderr else None,
        execution_time_ms=elapsed_ms
    )


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_code(
    sub_in: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save candidate submission and automatically run code similarity checks
    against previous submissions for the same question.
    """
    session = db.query(AssessmentSession).filter(AssessmentSession.id == sub_in.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if current_user.role != "admin" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    question = db.query(Question).filter(Question.id == sub_in.question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    submission = Submission(
        session_id=session.id,
        question_id=question.id,
        code=sub_in.code,
        language=sub_in.language,
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Compare against prior submissions for this question
    prior_submissions = db.query(Submission).filter(
        Submission.question_id == question.id,
        Submission.id != submission.id,
        Submission.session_id != session.id
    ).all()

    max_sim = 0.0
    highest_sim_sub_id = None

    for prior in prior_submissions:
        sim_analysis = analyze_code_similarity(submission.code, prior.code, language=submission.language)
        sim_score = sim_analysis["similarity_score"]
        
        sim_record = SimilarityResult(
            submission_id=submission.id,
            compared_submission_id=prior.id,
            similarity_score=sim_score,
            method=sim_analysis["method"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(sim_record)

        if sim_score > max_sim:
            max_sim = sim_score
            highest_sim_sub_id = prior.id

    db.commit()

    # If high similarity detected, record monitoring event
    if max_sim >= 0.75:
        await event_processor.process_event(db, EventCreate(
            session_id=session.id,
            event_type="HIGH_CODE_SIMILARITY",
            severity="HIGH" if max_sim >= 0.85 else "MEDIUM",
            score_contribution=25.0 if max_sim >= 0.85 else 15.0,
            metadata={
                "similarity_score": round(max_sim, 3),
                "compared_submission_id": highest_sim_sub_id,
                "note": "High code similarity identified against existing submission."
            }
        ))
    else:
        # Standard submission event
        await event_processor.process_event(db, EventCreate(
            session_id=session.id,
            event_type="SUBMISSION",
            severity="LOW",
            score_contribution=0.0,
            metadata={"submission_id": submission.id, "language": submission.language}
        ))

    return submission


@router.get("/{id}", response_model=SubmissionResponse)
def get_submission(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve submission code and metadata."""
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return sub
