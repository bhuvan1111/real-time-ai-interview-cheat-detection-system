import json
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.services.anomaly_detector import anomaly_detector


def determine_risk_level(score: float) -> str:
    """Classify risk score into LOW, MEDIUM, HIGH, or CRITICAL."""
    if score >= 75.0:
        return "CRITICAL"
    elif score >= 50.0:
        return "HIGH"
    elif score >= 25.0:
        return "MEDIUM"
    return "LOW"


class SuspicionEngine:
    """
    Transparent, explainable risk scoring engine.
    Combines deterministic heuristics, ML behavioral anomaly detection,
    and code similarity into a calibrated 0-100 risk score with human explanations.
    """
    def __init__(self):
        self.weights = {
            "tab_switch": settings.TAB_SWITCH_WEIGHT,
            "long_tab_switch": settings.LONG_TAB_SWITCH_WEIGHT,
            "large_paste": settings.LARGE_PASTE_WEIGHT,
            "repeated_large_paste": settings.REPEATED_LARGE_PASTE_WEIGHT,
            "typing_anomaly": settings.TYPING_ANOMALY_WEIGHT,
            "code_similarity": settings.CODE_SIMILARITY_WEIGHT,
            "multi_signal": settings.MULTI_SIGNAL_BONUS_WEIGHT,
        }

    def calculate_session_risk(self, metrics: Dict[str, Any]) -> Tuple[float, str, List[str], float]:
        """
        Calculates composite risk score, risk level, plain-English reasons, and anomaly score.
        Never exceeds 100.0.
        """
        rule_score = 0.0
        reasons: List[str] = []
        signals_triggered = 0

        tab_switches = int(metrics.get("tab_switch_count", 0))
        total_hidden_duration = float(metrics.get("total_hidden_duration", 0.0))
        long_tab_switches = int(metrics.get("long_tab_switch_count", 0))
        
        paste_count = int(metrics.get("paste_count", 0))
        large_paste_count = int(metrics.get("large_paste_count", 0))
        
        blur_count = int(metrics.get("blur_count", 0))
        total_blur_duration = float(metrics.get("total_blur_duration", 0.0))
        
        chars_typed = int(metrics.get("characters_typed", 0))
        paste_characters = int(metrics.get("paste_characters", 0))
        max_similarity = float(metrics.get("code_similarity_max", 0.0))

        # 1. Tab switches
        if tab_switches > 0:
            signals_triggered += 1
            pts = tab_switches * self.weights["tab_switch"]
            rule_score += pts
            avg_hidden = round(total_hidden_duration / max(1, tab_switches), 1)
            reasons.append(f"{tab_switches} tab switch{'es' if tab_switches > 1 else ''} detected (total {round(total_hidden_duration, 1)}s hidden, avg {avg_hidden}s).")

        # 2. Long tab switches (> 5 seconds out of view)
        if long_tab_switches > 0:
            signals_triggered += 1
            pts = long_tab_switches * self.weights["long_tab_switch"]
            rule_score += pts
            reasons.append(f"{long_tab_switches} prolonged absence{'s' if long_tab_switches > 1 else ''} (>5s) away from assessment window.")

        # 3. Window blur / lost focus
        if blur_count > 2:
            signals_triggered += 1
            pts = min(15.0, blur_count * 3.0)
            rule_score += pts
            reasons.append(f"{blur_count} window focus loss events detected (total {round(total_blur_duration, 1)}s inactive).")

        # 4. Large paste operations (> 300 chars)
        if large_paste_count > 0:
            signals_triggered += 1
            pts = self.weights["large_paste"]
            if large_paste_count > 1:
                pts += (large_paste_count - 1) * self.weights["repeated_large_paste"]
            rule_score += pts
            reasons.append(f"{large_paste_count} large paste operation{'s' if large_paste_count > 1 else ''} (>300 characters) recorded.")

        # 5. Typing anomaly / Paste-to-typing disproportion
        total_input = chars_typed + paste_characters
        if total_input > 100:
            paste_ratio = paste_characters / total_input
            if paste_ratio > 0.70:
                signals_triggered += 1
                rule_score += self.weights["typing_anomaly"]
                reasons.append(f"High paste-to-typing ratio ({round(paste_ratio * 100)}% of submitted characters originated from clipboard pastes).")
        elif total_input > 0 and chars_typed < 10 and paste_characters > 150:
            signals_triggered += 1
            rule_score += self.weights["typing_anomaly"]
            reasons.append("Code appeared suddenly via paste with negligible typed interactions.")

        # 6. Code similarity signal
        if max_similarity >= 0.75:
            signals_triggered += 1
            sim_pts = self.weights["code_similarity"] * (max_similarity)
            rule_score += sim_pts
            reasons.append(f"High code similarity ({round(max_similarity * 100, 1)}%) detected compared with another candidate's submission.")

        # 7. Contextual multi-signal synergy
        if signals_triggered >= 3:
            rule_score += self.weights["multi_signal"]
            reasons.append(f"Correlation bonus: Multiple distinct suspicious vectors ({signals_triggered} indicators) occurred in session.")

        # 8. Behavioral ML Anomaly Score
        anomaly_score = anomaly_detector.score_session(metrics)
        if anomaly_score > 60.0:
            reasons.append(f"Behavioral ML anomaly model flagged typing/interaction distribution (anomaly index {round(anomaly_score)}).")

        # Composite score: 70% rule-based + 30% ML anomaly
        composite_score = (0.70 * rule_score) + (0.30 * anomaly_score)

        # Cap strictly between 0.0 and 100.0
        final_score = float(max(0.0, min(100.0, round(composite_score, 1))))
        risk_level = determine_risk_level(final_score)

        if not reasons:
            reasons.append("Assessment session activity is within expected normal parameters.")

        return final_score, risk_level, reasons, anomaly_score


risk_engine = SuspicionEngine()
