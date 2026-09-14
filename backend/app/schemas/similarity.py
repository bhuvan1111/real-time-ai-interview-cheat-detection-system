import datetime
from typing import Optional, List
from pydantic import BaseModel


class SimilarityAnalysisRequest(BaseModel):
    submission_id: Optional[int] = None
    code_a: Optional[str] = None
    code_b: Optional[str] = None
    language: Optional[str] = "python"


class SimilarityPairResult(BaseModel):
    compared_submission_id: Optional[int] = None
    candidate_name: Optional[str] = None
    similarity_score: float
    token_similarity: float
    ast_similarity: float
    method: str
    explanation: str


class SimilarityResultResponse(BaseModel):
    id: Optional[int] = None
    submission_id: Optional[int] = None
    highest_similarity: float
    results: List[SimilarityPairResult]
    disclaimer: str = (
        "High code similarity does not definitively indicate cheating. Candidates solving standard algorithmic "
        "tasks may naturally produce similar control flows. Human review is recommended."
    )
