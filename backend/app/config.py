import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BhuvanGuard AI - Real-Time Cheat Detection System"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./cheat_detection.db"
    
    # JWT & Auth
    JWT_SECRET: str = "super-secret-key-change-in-production-realtime-cheat-detection-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    # Detection Thresholds
    SMALL_PASTE_THRESHOLD: int = 50
    MEDIUM_PASTE_THRESHOLD: int = 300
    
    # Risk Rule Weights
    TAB_SWITCH_WEIGHT: float = 5.0
    LONG_TAB_SWITCH_WEIGHT: float = 10.0
    LARGE_PASTE_WEIGHT: float = 10.0
    REPEATED_LARGE_PASTE_WEIGHT: float = 15.0
    TYPING_ANOMALY_WEIGHT: float = 10.0
    CODE_SIMILARITY_WEIGHT: float = 25.0
    MULTI_SIGNAL_BONUS_WEIGHT: float = 10.0
    
    # ML Model Path
    ML_MODEL_PATH: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "ml", "models", "isolation_forest.joblib"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
