# Privacy & Ethics Framework

## 1. Ethical Assessment Principles

InterviewGuard adheres strictly to privacy-first, ethical evaluation standards:

1. **Non-Invasive Monitoring**:
   - **No Webcam or Audio Recording**: We do not record video feeds, microphones, room audio, or ambient noise.
   - **No Facial Recognition or Biometrics**: Candidates are not subjected to biometric profiling or emotional state analysis.
   - **No Keylogging**: We do NOT record individual key names, passwords, or typed text outside of the submitted code editor value.
   - **No Clipboard Snooping**: Paste events record character counts only (`character_count = 340`). Clipboard text is discarded immediately.
   - **No Cross-Tab or Desktop Inspection**: We never inspect other browser tabs, application windows, or browser history.

2. **Informed Candidate Consent**:
   - Every candidate is shown an explicit disclosure modal detailing all telemetry items before an assessment begins.
   - The candidate must check an agreement checkbox before entering the code editor.

3. **Assistive, Non-Accusatory Classification**:
   - The system **never declares a candidate has cheated**.
   - Scores are framed as an assessment integrity index (0–100).
   - High scores recommend: *"Multiple anomalous signals detected. Human review recommended."*

4. **Human in the Loop**:
   - Algorithmic signals assist human interviewers; they never replace human discretion.
   - Two candidates solving standard algorithmic problems may naturally arrive at structurally similar solutions. Evaluators review the problem constraints and context before making hiring decisions.

5. **Data Minimization & Retention**:
   - Telemetry data consists strictly of numeric timestamps, event names, and metadata counts.
   - Configurable retention periods ensure assessment telemetry is scrubbed in compliance with privacy regulations (e.g., GDPR).
