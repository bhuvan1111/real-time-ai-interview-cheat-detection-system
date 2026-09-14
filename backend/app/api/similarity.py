from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import Submission, SimilarityResult
from app.models.user import User
from app.schemas.similarity import (
    SimilarityAnalysisRequest,
    SimilarityPairResult,
    SimilarityResultResponse,
)
from app.services.similarity import analyze_code_similarity
from app.api.deps import get_current_user

router = APIRouter(prefix="/similarity", tags=["Code Similarity"])


@router.post("/analyze", response_model=SimilarityResultResponse)
def analyze_similarity(
    req: SimilarityAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform on-demand code similarity analysis.
    Supports either comparing two direct code snippets (code_a and code_b),
    or comparing a submission against all other submissions for that question.
    """
    # Mode 1: Direct comparison between two code snippets
    if req.code_a is not None and req.code_b is not None:
        analysis = analyze_code_similarity(req.code_a, req.code_b, language=req.language or "python")
        pair = SimilarityPairResult(
            similarity_score=analysis["similarity_score"],
            token_similarity=analysis["token_similarity"],
            ast_similarity=analysis["ast_similarity"],
            method=analysis["method"],
            explanation=analysis["explanation"]
        )
        return SimilarityResultResponse(
            highest_similarity=analysis["similarity_score"],
            results=[pair]
        )

    # Mode 2: Submission comparison
    if req.submission_id is not None:
        sub = db.query(Submission).filter(Submission.id == req.submission_id).first()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

        other_subs = db.query(Submission).filter(
            Submission.question_id == sub.question_id,
            Submission.id != sub.id
        ).all()

        results: List[SimilarityPairResult] = []
        max_sim = 0.0

        for other in other_subs:
            analysis = analyze_code_similarity(sub.code, other.code, language=sub.language)
            sim_score = analysis["similarity_score"]
            if sim_score > max_sim:
                max_sim = sim_score

            candidate_name = other.session.candidate.name if (other.session and other.session.candidate) else f"Submission #{other.id}"
            results.append(SimilarityPairResult(
                compared_submission_id=other.id,
                candidate_name=candidate_name,
                similarity_score=sim_score,
                token_similarity=analysis["token_similarity"],
                ast_similarity=analysis["ast_similarity"],
                method=analysis["method"],
                explanation=analysis["explanation"]
            ))

        # Sort descending by similarity
        results.sort(key=lambda x: x.similarity_score, reverse=True)
        return SimilarityResultResponse(
            submission_id=sub.id,
            highest_similarity=max_sim,
            results=results
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Provide either (code_a and code_b) or submission_id"
    )


@router.get("/{submission_id}", response_model=SimilarityResultResponse)
def get_submission_similarity(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve precalculated similarity records for a specific submission."""
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    sim_records = db.query(SimilarityResult).filter(SimilarityResult.submission_id == submission_id).all()
    results = []
    max_sim = 0.0

    for rec in sim_records:
        if rec.similarity_score > max_sim:
            max_sim = rec.similarity_score
        cand_name = (
            rec.compared_submission.session.candidate.name
            if rec.compared_submission and rec.compared_submission.session and rec.compared_submission.session.candidate
            else f"Submission #{rec.compared_submission_id}"
        )
        results.append(SimilarityPairResult(
            compared_submission_id=rec.compared_submission_id,
            candidate_name=cand_name,
            similarity_score=rec.similarity_score,
            token_similarity=rec.similarity_score,
            ast_similarity=rec.similarity_score,
            method=rec.method,
            explanation=f"Recorded similarity score of {round(rec.similarity_score * 100, 1)}% via {rec.method}."
        ))

    results.sort(key=lambda x: x.similarity_score, reverse=True)
    return SimilarityResultResponse(
        submission_id=submission_id,
        highest_similarity=max_sim,
        results=results
    )
