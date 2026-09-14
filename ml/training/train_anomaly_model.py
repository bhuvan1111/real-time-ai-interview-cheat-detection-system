import os
import sys
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")


def generate_training_data(n_samples: int = 5000) -> np.ndarray:
    """
    Generates synthetic dataset of session behaviors:
    - 90% normal/standard candidate activity
    - 10% outlier/atypical activity
    """
    np.random.seed(42)

    # 1. Normal Candidates (n = 4500)
    n_norm = int(n_samples * 0.90)
    norm_tab_switches = np.random.poisson(lam=1.5, size=n_norm)
    norm_avg_hidden = np.random.exponential(scale=3.0, size=n_norm)
    norm_pastes = np.random.poisson(lam=2.0, size=n_norm)
    norm_large_pastes = np.random.binomial(n=1, p=0.03, size=n_norm)
    norm_typing_speed = np.clip(np.random.normal(loc=190, scale=45, size=n_norm), 40, 450)
    norm_deletion_ratio = np.random.beta(a=2, b=10, size=n_norm)
    norm_inactivity = np.random.exponential(scale=30.0, size=n_norm)
    norm_paste_ratio = np.random.beta(a=1, b=8, size=n_norm)
    norm_duration = np.random.uniform(900, 3600, size=n_norm)

    X_norm = np.column_stack([
        norm_tab_switches, norm_avg_hidden, norm_pastes, norm_large_pastes,
        norm_typing_speed, norm_deletion_ratio, norm_inactivity, norm_paste_ratio, norm_duration
    ])

    # 2. Outlier / Suspicious Candidates (n = 500)
    n_out = n_samples - n_norm
    out_tab_switches = np.random.poisson(lam=9.0, size=n_out)
    out_avg_hidden = np.random.exponential(scale=18.0, size=n_out)
    out_pastes = np.random.poisson(lam=6.0, size=n_out)
    out_large_pastes = np.random.poisson(lam=3.5, size=n_out)
    out_typing_speed = np.random.choice([20.0, 550.0], size=n_out)  # Either barely typed or bot-like burst
    out_deletion_ratio = np.random.uniform(0.0, 0.05, size=n_out)
    out_inactivity = np.random.uniform(90.0, 300.0, size=n_out)
    out_paste_ratio = np.random.uniform(0.70, 0.98, size=n_out)
    out_duration = np.random.uniform(300, 1800, size=n_out)

    X_out = np.column_stack([
        out_tab_switches, out_avg_hidden, out_pastes, out_large_pastes,
        out_typing_speed, out_deletion_ratio, out_inactivity, out_paste_ratio, out_duration
    ])

    X_total = np.vstack([X_norm, X_out])
    np.random.shuffle(X_total)
    return X_total


def train_and_save_model():
    print(f"Generating synthetic session dataset...")
    X = generate_training_data(6000)
    
    print(f"Fitting IsolationForest model (contamination=0.10)...")
    clf = IsolationForest(
        n_estimators=150,
        contamination=0.10,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved successfully to {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save_model()
