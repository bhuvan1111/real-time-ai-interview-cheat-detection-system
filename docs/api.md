# REST & WebSocket API Specification

## 1. Authentication Endpoints

### `POST /api/auth/register`
Registers a new user account.
- **Request Body**:
  ```json
  {
    "name": "Alice Smith",
    "email": "alice@candidate.com",
    "password": "Password123!",
    "role": "candidate"
  }
  ```
- **Response**: `201 Created` with JWT `access_token` and user profile.

### `POST /api/auth/login`
Authenticates credentials and returns a JWT access token.
- **Request Body**:
  ```json
  {
    "email": "admin@interview.ai",
    "password": "AdminPass123!"
  }
  ```

### `GET /api/auth/me`
Retrieves current authenticated user's profile.

---

## 2. Assessment Management

### `GET /api/assessments`
Lists all technical coding assessments.

### `POST /api/assessments` *(Admin only)*
Creates an assessment with questions.

### `GET /api/assessments/{id}`
Returns assessment details with problems and starter code.

### `PUT /api/assessments/{id}` *(Admin only)*
Updates assessment properties.

### `DELETE /api/assessments/{id}` *(Admin only)*
Deletes an assessment.

---

## 3. Candidate Session Endpoints

### `POST /api/sessions`
Starts a session for the authenticated candidate.
- **Request Body**: `{ "assessment_id": 1 }`

### `GET /api/sessions`
Lists candidate sessions (Admins see all; Candidates see their own).

### `GET /api/sessions/{id}`
Returns full session telemetry, explainable risk reasons, and recent events.

### `POST /api/sessions/{id}/finish`
Marks session as finished/submitted.

---

## 4. Monitoring Events

### `POST /api/events`
REST fallback endpoint to ingest candidate interaction events.
- **Request Body**:
  ```json
  {
    "session_id": 1,
    "event_type": "TAB_SWITCH",
    "metadata": { "duration": 4.2 }
  }
  ```

### `GET /api/sessions/{id}/events`
Returns chronological timeline of all recorded events for the session.

---

## 5. Submissions & Code Execution

### `POST /api/submissions`
Submits final candidate code and executes automated AST cross-similarity comparison.

### `POST /api/submissions/run`
Executes code in a secure sandbox process with 5.0-second timeout.
- **Request Body**:
  ```json
  {
    "code": "print('Hello World')",
    "language": "python"
  }
  ```

---

## 6. Code Similarity Analysis

### `POST /api/similarity/analyze`
On-demand similarity analysis between two code snippets or across all submissions.

### `GET /api/similarity/{submission_id}`
Returns pre-calculated cross-candidate similarity comparisons.

---

## 7. WebSocket Streaming

### Candidate Channel: `/ws/session/{session_id}?token={jwt}`
- Stream events from browser to backend:
  ```json
  {
    "type": "EVENT",
    "event_type": "PASTE",
    "metadata": { "character_count": 450 }
  }
  ```
- Server responds with acknowledgment and updated score.

### Admin Live Channel: `/ws/admin?token={jwt}`
- Broadcasts real-time events across all candidates.
