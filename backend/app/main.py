import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import RiskRule
from app.api import (
    auth,
    assessments,
    questions,
    sessions,
    events,
    submissions,
    similarity,
    analytics,
    websockets,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def init_default_rules():
    """Seed initial risk rules if not present."""
    db = SessionLocal()
    try:
        if db.query(RiskRule).count() == 0:
            default_rules = [
                RiskRule(rule_name="TAB_SWITCH", weight=settings.TAB_SWITCH_WEIGHT, threshold=1.0, enabled=True),
                RiskRule(rule_name="LONG_TAB_SWITCH", weight=settings.LONG_TAB_SWITCH_WEIGHT, threshold=5.0, enabled=True),
                RiskRule(rule_name="LARGE_PASTE", weight=settings.LARGE_PASTE_WEIGHT, threshold=300.0, enabled=True),
                RiskRule(rule_name="REPEATED_LARGE_PASTE", weight=settings.REPEATED_LARGE_PASTE_WEIGHT, threshold=2.0, enabled=True),
                RiskRule(rule_name="TYPING_ANOMALY", weight=settings.TYPING_ANOMALY_WEIGHT, threshold=0.70, enabled=True),
                RiskRule(rule_name="CODE_SIMILARITY", weight=settings.CODE_SIMILARITY_WEIGHT, threshold=0.75, enabled=True),
                RiskRule(rule_name="MULTI_SIGNAL", weight=settings.MULTI_SIGNAL_BONUS_WEIGHT, threshold=3.0, enabled=True),
            ]
            db.add_all(default_rules)
            db.commit()
            logger.info("Initialized default risk scoring rules.")
    except Exception as e:
        logger.warning(f"Could not init default rules: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    init_default_rules()
    logger.info(f"System ready: {settings.PROJECT_NAME}")
    yield
    # Shutdown
    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Explainable Real-Time AI Interview Cheat Detection System with AST/Token Similarity and Behavioral Anomaly ML.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(questions.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(similarity.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(websockets.router)


@app.get("/api/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
