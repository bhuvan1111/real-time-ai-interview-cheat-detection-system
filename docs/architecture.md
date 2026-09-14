# System Architecture

## 1. High-Level Architecture Overview

```
                        +----------------------------+
                        |  Candidate Browser (React) |
                        |  - Monaco Code Editor      |
                        |  - Non-Invasive Listeners  |
                        +--------------+-------------+
                                       |
                   HTTP REST APIs      |  WebSocket Stream (/ws/session)
                   (Submissions, Auth) |  (Tab switches, Blurs, Pastes)
                                       v
                        +----------------------------+
                        |       FastAPI Backend      |
                        |  - JWT Authentication      |
                        |  - REST Request Routers    |
                        |  - Event Ingestion Engine  |
                        +--------------+-------------+
                                       |
                  +--------------------+--------------------+
                  |                                         |
                  v                                         v
        +-------------------+                     +-------------------+
        |  Database Layer   |                     | Suspicion Engine  |
        |  - PostgreSQL /   |                     | - Rule Heuristics |
        |    SQLite Fallback|                     | - Isolation Forest|
        |  - SQLAlchemy ORM |                     | - AST & Token Sim |
        +-------------------+                     +---------+---------+
                                                            |
                                        Live Admin Broadcast|
                                        (/ws/admin)         |
                                                            v
                                                  +-------------------+
                                                  | Admin Monitoring  |
                                                  | - Live Grid Wall  |
                                                  | - Timeline Curve  |
                                                  | - Explainability  |
                                                  +-------------------+
```

---

## 2. Core Subsystems

### A. Candidate Assessment Client
- **Monaco Editor**: Integrated web coding environment with language selection (Python, JavaScript), auto-saving, and test execution sandbox.
- **Client-Side Non-Invasive Telemetry**:
  - `document.visibilitychange` records hidden duration (`TAB_SWITCH`).
  - `window.blur` / `window.focus` records out-of-focus elapsed seconds (`WINDOW_BLUR`).
  - `paste` event on editor intercepts character count only (`character_count`), discarding clipboard content.
  - Keystroke dynamics tracks insertions, deletions, typing bursts, and inactivity.

### B. Real-Time WebSocket Pipeline
- Active candidate connections connect to `/ws/session/{session_id}`.
- Every event is ingested by `EventProcessor`, stored with timestamps and metadata, and triggers risk re-computation.
- Re-computed risk levels and explainable evidence are broadcast to all connected evaluators on `/ws/admin` without page reloads.

### C. Explainable Suspicion Scoring Engine
- Combines 7 configurable heuristics, an unsupervised Isolation Forest anomaly model, and AST/token code similarity.
- Outputs an explainable score between 0 and 100 with clear evidence points and non-accusatory advice ("Human review recommended").

### D. Code Similarity Engine
- **AST Structural Normalization**: Normalizes variable identifiers and compares syntax trees using Python's `ast` parser.
- **Token TF-IDF Cosine Similarity**: Normalizes whitespace and comments to compute lexical overlap.
