# BhuvanGuard AI — Real-Time Interview Cheat Detection System

An enterprise-grade, privacy-conscious full-stack platform designed for online coding assessments and technical interviews. The platform monitors assessment session events in real time and flags potentially anomalous patterns—such as excessive tab switching, abnormal pasting, typing anomalies, and cross-candidate code similarity—while preserving candidate privacy and providing explainable signals for human evaluators.

---

## Table of Contents
- [1. Overview](#1-overview)
- [2. Key Features](#2-key-features)
- [3. Architecture](#3-architecture)
- [4. Tech Stack](#4-tech-stack)
- [5. Privacy & Ethical Standards](#5-privacy--ethical-standards)
- [6. Detection Methodology & Risk Scoring](#6-detection-methodology--risk-scoring)
- [7. Code Similarity Engine](#7-code-similarity-engine)
- [8. Quick Start (Local Run)](#8-quick-start-local-run)
- [9. Docker Deployment](#9-docker-deployment)
- [10. Demo Credentials](#10-demo-credentials)
- [11. Testing](#11-testing)
- [12. API Documentation](#12-api-documentation)
- [13. Future Improvements](#13-future-improvements)

---

## 1. Overview

During remote technical interviews, assessing coding ability fairly is critical. Traditional invasive proctoring tools record webcams, track eye movements, or inspect desktop applications—violating candidate trust.

**InterviewGuard** takes a non-invasive, explainable approach:
1. **Never records video, audio, or desktop history.**
2. **Never stores keystroke text or clipboard content.**
3. **Uses transparent heuristic rules and an Isolation Forest ML model** to analyze session interaction patterns.
4. **Performs AST and token-based code similarity analysis** to detect structural duplication across candidates.
5. **Adheres to the "Human in the Loop" principle:** The system generates a calibrated 0–100 risk score and plain-English rationale rather than making automated cheat accusations.

---

## 2. Key Features

- **Candidate Coding Room**: Professional Monaco editor with syntax highlighting, language selection (Python, JavaScript), auto-saving, sandboxed test runner, and timekeeper.
- **Informed Candidate Consent**: Mandatory pre-assessment disclosure screen detailing exactly what metadata is collected.
- **Non-Invasive Client Telemetry**:
  - Tab visibility tracking (`document.hidden` and elapsed seconds away).
  - Window focus/blur tracking (`window.blur` / `window.focus`).
  - Paste metadata collection (`character_count` only; clipboard text is discarded).
  - Keystroke dynamics (insertions, deletions, typing bursts, and inactivity).
- **Real-Time WebSocket Pipeline**: Instant event transmission from candidate browser to FastAPI backend and live broadcast to evaluator dashboards.
- **Evaluator Live Monitoring Wall**: Real-time grid of active candidates updating automatically without page refresh.
- **Explainable Evidence Breakdown**: Plain-English bullet points detailing each contributing factor and recommendation.
- **Dual-Method Code Similarity**:
  - Python Abstract Syntax Tree (AST) structural normalization (resilient to renamed variables).
  - Token-level TF-IDF cosine similarity.
- **Interactive Analytics**: Visual Recharts dashboards displaying risk distributions, signal volumes, and timeline curves.

---

## 3. Architecture

```
Candidate Browser (React 18 + Monaco Editor)
  │
  ├── HTTPS REST API ──────► FastAPI Backend
  │                          │
  └── WebSocket Stream ─────►├── Event Ingestion & Persistence
                             ├── Suspicion Scoring Engine (Heuristics + ML)
                             ├── Python AST & Token Similarity Engine
                             └── PostgreSQL / SQLite Fallback
                                     │
                                     ▼
                     Admin Live Monitoring Wall (WebSockets)
```

Detailed architectural diagrams and component specifications are documented in [`docs/architecture.md`](docs/architecture.md).

---

## 4. Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Validation**: Pydantic v2 & Pydantic Settings
- **ORM / Database**: SQLAlchemy (PostgreSQL with seamless SQLite fallback)
- **Authentication**: JWT access tokens & bcrypt password hashing
- **Real-Time**: Native ASGI WebSockets
- **Server**: Uvicorn

### Machine Learning & Data Science
- **Behavioral Anomaly Detection**: scikit-learn `IsolationForest`
- **Code Analysis**: Python built-in `ast` parser & `TfidfVectorizer`
- **Mathematics**: NumPy, pandas, joblib

---

## 5. Privacy & Ethical Standards

- **Zero Invasive Surveillance**: No webcams, no microphones, no screen recordings.
- **No Clipboard Snooping**: We record character counts (`count: 420`), never the actual pasted text.
- **Explicit Consent**: Candidates review a clear data collection notice and must click "I Consent" before accessing problems.
- **Assistive Non-Accusatory Tone**: Reports state: *"Multiple anomalous signals detected. Human review recommended."*

Detailed ethical guidelines are in [`docs/privacy.md`](docs/privacy.md).

---

## 6. Detection Methodology & Risk Scoring

Composite Risk Score:
$$\text{Risk Score} = \min\left(100, \text{round}(0.70 \times \text{RuleScore} + 0.30 \times \text{AnomalyScore})\right)$$

### Heuristic Weights
- `TAB_SWITCH`: +5.0 per event
- `LONG_TAB_SWITCH` (> 5s): +10.0
- `WINDOW_BLUR` (> 2 times): +3.0 per blur (max 15)
- `LARGE_PASTE` (> 300 chars): +10.0 (+15.0 for repeats)
- `TYPING_ANOMALY` (Paste ratio > 70%): +10.0
- `CODE_SIMILARITY` (> 75%): +25.0 * similarity_score
- `MULTI_SIGNAL_BONUS`: +10.0 contextual synergy

### Risk Tiers
- **0–24**: `LOW` — Normal, typical problem-solving.
- **25–49**: `MEDIUM` — Occasional window blur or small paste.
- **50–74**: `HIGH` — Repeated absences or large paste blocks; review recommended.
- **75–100**: `CRITICAL` — High density of multi-vector anomalies; prioritized for evaluation.

Full formulation is in [`docs/detection-methodology.md`](docs/detection-methodology.md).

---

## 7. Code Similarity Engine

1. **Token TF-IDF Cosine Similarity**: Strips comments and whitespace, tokenizes programming tokens, and computes vector cosine distance.
2. **AST Structural Normalization**: Normalizes variable and argument names (`v_1`, `v_2`, `v_3`) using `ast.NodeTransformer` and compares syntactic sequence grammar, catching structural copying even if identifiers are renamed.

---

## 8. Quick Start (Local Run)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate

pip install -r requirements.txt
python seed_data.py
uvicorn app.main:app --reload --port 8000
```
Backend API and Swagger docs will be live at `http://localhost:8000/docs`.

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be live at `http://localhost:5173`.

---

## 9. Docker Deployment

Launch the entire stack (PostgreSQL + FastAPI backend + React/Nginx frontend) with one command:

```bash
docker compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 10. Demo Credentials

The seed script automatically initializes accounts with varied risk profiles:

| Role | Name | Email | Password | Risk Profile |
| :--- | :--- | :--- | :--- | :--- |
| **Lead Evaluator** | Bhuvan Sai | `admin@interview.ai` | `AdminPass123!` | Evaluator Console |
| **Candidate** | Alice Smith | `alice@candidate.com` | `CandidatePass123!` | **LOW** (12/100) |
| **Candidate** | Bob Johnson | `bob@candidate.com` | `CandidatePass123!` | **MEDIUM** (38/100) |
| **Candidate** | Charlie Brown | `charlie@candidate.com` | `CandidatePass123!` | **HIGH** (68/100) |
| **Candidate** | Diana Prince | `diana@candidate.com` | `CandidatePass123!` | **CRITICAL** (89/100) |

The login screen also features **one-click demo buttons** to instantly log in as any profile.

---

## 11. Testing

Run the comprehensive pytest suite covering authentication, assessments, sessions, event ingestion, risk engine boundaries, AST similarity, and WebSockets:

```bash
cd backend
venv\Scripts\pytest -v
```

Output:
```
backend/tests/test_assessments.py::test_admin_create_assessment PASSED
backend/tests/test_assessments.py::test_candidate_cannot_create_assessment PASSED
backend/tests/test_assessments.py::test_list_assessments PASSED
backend/tests/test_auth.py::test_register_candidate PASSED
backend/tests/test_auth.py::test_register_duplicate_email PASSED
backend/tests/test_auth.py::test_login_success PASSED
backend/tests/test_auth.py::test_login_invalid_password PASSED
backend/tests/test_auth.py::test_get_me PASSED
backend/tests/test_auth.py::test_get_me_unauthorized PASSED
backend/tests/test_events.py::test_event_ingestion_and_risk_update PASSED
backend/tests/test_scoring.py::test_normal_behavior_low_score PASSED
backend/tests/test_scoring.py::test_repeated_large_paste_and_tab_switches PASSED
backend/tests/test_scoring.py::test_score_never_exceeds_100 PASSED
backend/tests/test_scoring.py::test_risk_level_boundaries PASSED
backend/tests/test_sessions.py::test_session_lifecycle PASSED
backend/tests/test_similarity.py::test_identical_code_similarity PASSED
backend/tests/test_similarity.py::test_renamed_variables_ast_similarity PASSED
backend/tests/test_similarity.py::test_unrelated_code_similarity PASSED
backend/tests/test_websockets.py::test_session_websocket_lifecycle PASSED
backend/tests/test_websockets.py::test_admin_websocket_connection PASSED
====================== 20 passed in 11.30s =======================
```

---

## 12. API Documentation

Comprehensive REST and WebSocket API specifications are detailed in [`docs/api.md`](docs/api.md). Interactive OpenAPI docs are available at `http://localhost:8000/docs`.

---

## 13. Future Improvements

- Distributed Celery/Redis background task workers for large-scale similarity matrices.
- Cross-session candidate profile tracking over historical interview stages.
- Candidate appeal and dispute resolution workflow.
- In-browser WebAssembly sandbox execution for additional compiled languages (C++, Go, Rust).

---

## Contributors

Built with precision for enterprise technical recruitment and ethical assessment integrity.
