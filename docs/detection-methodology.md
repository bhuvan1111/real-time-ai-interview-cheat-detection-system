# Detection Methodology & Scoring Formulation

## 1. Multi-Signal Hybrid Scoring Model

InterviewGuard combines deterministic heuristics, machine learning behavioral anomaly detection, and structural code similarity.

```
Risk Score = min(100, round(0.70 * RuleScore + 0.30 * AnomalyScore))
```

---

## 2. Rule-Based Scoring Engine

| Signal Category | Trigger Condition | Weight Contribution |
| :--- | :--- | :--- |
| `TAB_SWITCH` | Tab visibility lost (`document.hidden`) | +5.0 per event |
| `LONG_TAB_SWITCH` | Tab hidden duration &gt; 5.0 seconds | +10.0 per occurrence |
| `WINDOW_BLUR` | Application focus loss &gt; 2 times | +3.0 per blur (max 15.0) |
| `LARGE_PASTE` | Clipboard paste &gt; 300 characters | +10.0 for first; +15.0 for subsequent |
| `TYPING_ANOMALY` | Paste-to-typing ratio &gt; 70% | +10.0 |
| `CODE_SIMILARITY` | Cross-submission similarity &gt; 75% | +25.0 * similarity_score |
| `MULTI_SIGNAL_BONUS` | 3 or more distinct suspicious signals | +10.0 contextual synergy |

### Risk Level Calibration

- **0 – 24**: `LOW` — Expected candidate problem-solving behavior.
- **25 – 49**: `MEDIUM` — Minor focus shifts or occasional small paste operations.
- **50 – 74**: `HIGH` — Repeated absences or large paste insertions. Discretionary review recommended.
- **75 – 100**: `CRITICAL` — High density of multi-vector anomalies or identical cross-submission AST structures. Prioritized for evaluator inspection.

---

## 3. Behavioral Anomaly Detection (Isolation Forest)

An unsupervised **Isolation Forest** evaluates candidate session interaction patterns against normal baseline distributions:

### Feature Vector (9 Dimensions):
1. `tab_switch_count`: Total count of visibility transitions.
2. `average_tab_hidden_duration`: Average seconds spent away per tab switch.
3. `paste_count`: Total paste operations.
4. `large_paste_count`: Pastes exceeding 300 characters.
5. `typing_speed`: Character insertions per minute.
6. `deletion_ratio`: Characters deleted / characters typed.
7. `inactivity_duration`: Longest stretch without keystrokes or mouse activity.
8. `paste_to_typing_ratio`: `paste_chars / (paste_chars + typed_chars)`.
9. `session_duration`: Total elapsed active session time.

---

## 4. Dual-Method Code Similarity Engine

### Technique 1: Token TF-IDF Cosine Similarity
- Strips single and multi-line comments and docstrings.
- Normalizes whitespace.
- Extracts programming tokens (keywords, identifiers, arithmetic operators, syntax brackets).
- Evaluates token unigrams and bigrams using TF-IDF vectorization and cosine similarity.

### Technique 2: Python Abstract Syntax Tree (AST) Normalization
- Parses source code into Python AST via the standard `ast` module.
- Normalizes variable names, local functions, and parameter names (`v_1`, `v_2`, `v_3`) using `ASTNormalizer(ast.NodeTransformer)`.
- Extracts sequential syntactic grammar nodes (`FunctionDef`, `For`, `BinOp`, `Assign`, `Return`).
- Vectorizes node n-grams to identify identical control-flow topologies even if all identifiers have been renamed.
