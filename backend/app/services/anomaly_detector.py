import os
import logging
from typing import Dict, Any, List
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from app.config import settings

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "tab_switch_count",
    "average_tab_hidden_duration",
    "paste_count",
    "large_paste_count",
    "typing_speed",
    "deletion_ratio",
    "inactivity_duration",
    "paste_to_typing_ratio",
    "session_duration",
]


class BehavioralAnomalyDetector:
    """
    Assists in detecting out-of-distribution candidate interaction patterns
    using an unsupervised Isolation Forest model.
    Assistive signal only - NOT a proof of misconduct.
    """
    def __init__(self, model_path: str = None):
        self.model_path = model_path or settings.ML_MODEL_PATH
        self.model: IsolationForest = None
        self._load_or_train_baseline()

    def _generate_synthetic_baseline(self, n_samples: int = 1000) -> np.ndarray:
        """
        Generate realistic baseline data representing typical benign candidate behavior:
        - Small tab switches (0 to 3)
        - Short hidden duration (0 to 5s)
        - Occasional small pastes (0 to 3)
        - Low large pastes (0)
        - Normal typing speed (100 to 300 chars/min)
        - Normal deletion ratio (0.05 to 0.25)
        - Reasonable inactivity (0 to 60s)
        - Low paste ratio (<0.2)
        - Normal duration (600 to 3600s)
        """
        np.random.seed(42)
        tab_switches = np.random.poisson(lam=1.2, size=n_samples)
        avg_hidden = np.random.exponential(scale=3.0, size=n_samples)
        pastes = np.random.poisson(lam=1.5, size=n_samples)
        large_pastes = np.random.binomial(n=1, p=0.03, size=n_samples)
        typing_speed = np.random.normal(loc=180, scale=40, size=n_samples)
        typing_speed = np.clip(typing_speed, 30, 450)
        deletion_ratio = np.random.beta(a=2, b=10, size=n_samples)
        inactivity = np.random.exponential(scale=35.0, size=n_samples)
        paste_ratio = np.random.beta(a=1, b=9, size=n_samples)
        duration = np.random.uniform(900, 3600, size=n_samples)

        X = np.column_stack([
            tab_switches,
            avg_hidden,
            pastes,
            large_pastes,
            typing_speed,
            deletion_ratio,
            inactivity,
            paste_ratio,
            duration
        ])
        return X

    def _load_or_train_baseline(self):
        """Loads saved Isolation Forest or trains a fresh baseline model."""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded Isolation Forest anomaly model from {self.model_path}")
                return
            except Exception as e:
                logger.warning(f"Failed to load model from {self.model_path}: {e}")

        logger.info("Training initial baseline Isolation Forest model...")
        X_train = self._generate_synthetic_baseline(1500)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42
        )
        self.model.fit(X_train)

        # Save model if directory exists or can be created
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            logger.info(f"Saved baseline anomaly model to {self.model_path}")
        except Exception as e:
            logger.warning(f"Could not persist model to disk: {e}")

    def extract_features(self, metrics: Dict[str, Any]) -> np.ndarray:
        """Extract and format feature vector from session metrics dictionary."""
        tab_switch_count = float(metrics.get("tab_switch_count", 0))
        total_hidden_duration = float(metrics.get("total_hidden_duration", 0))
        avg_hidden = total_hidden_duration / max(1.0, tab_switch_count) if tab_switch_count > 0 else 0.0
        
        paste_count = float(metrics.get("paste_count", 0))
        large_paste_count = float(metrics.get("large_paste_count", 0))
        
        chars_typed = float(metrics.get("characters_typed", 0))
        chars_deleted = float(metrics.get("characters_deleted", 0))
        paste_chars = float(metrics.get("paste_characters", 0))
        duration_s = max(10.0, float(metrics.get("session_duration_s", 60.0)))
        
        # Typing speed in chars / min
        typing_speed = (chars_typed / (duration_s / 60.0))
        # Deletion ratio
        deletion_ratio = (chars_deleted / max(1.0, chars_typed))
        # Inactivity duration
        inactivity = float(metrics.get("inactivity_duration_s", 0.0))
        # Paste to typing ratio
        total_input = paste_chars + chars_typed
        paste_ratio = (paste_chars / total_input) if total_input > 0 else 0.0

        feat_vector = np.array([[
            tab_switch_count,
            avg_hidden,
            paste_count,
            large_paste_count,
            typing_speed,
            deletion_ratio,
            inactivity,
            paste_ratio,
            duration_s
        ]])
        return feat_vector

    def score_session(self, metrics: Dict[str, Any]) -> float:
        """
        Calculates an anomaly score between 0.0 and 100.0.
        IsolationForest decision_function outputs values where lower/negative = more anomalous.
        We transform this into a 0 (typical) to 100 (extreme anomaly) score.
        """
        if self.model is None:
            return 0.0

        try:
            X = self.extract_features(metrics)
            # decision_function yields roughly [-0.5, 0.5]
            raw_score = self.model.decision_function(X)[0]
            
            # Linear/sigmoid mapping: raw_score >= 0.15 -> 0, raw_score <= -0.25 -> 100
            # normalized = clip((0.15 - raw_score) / 0.40 * 100, 0, 100)
            norm_score = float(np.clip((0.15 - raw_score) / 0.40 * 100.0, 0.0, 100.0))
            return round(norm_score, 1)
        except Exception as e:
            logger.error(f"Error computing anomaly score: {e}")
            return 0.0


anomaly_detector = BehavioralAnomalyDetector()
