from app.services.risk_engine import risk_engine, determine_risk_level


def test_normal_behavior_low_score():
    metrics = {
        "tab_switch_count": 0,
        "total_hidden_duration": 0.0,
        "paste_count": 1,
        "large_paste_count": 0,
        "blur_count": 0,
        "characters_typed": 400,
        "paste_characters": 25,
        "session_duration_s": 1200,
        "code_similarity_max": 0.1
    }
    score, level, reasons, anomaly = risk_engine.calculate_session_risk(metrics)
    assert score < 25.0
    assert level == "LOW"
    assert len(reasons) > 0


def test_repeated_large_paste_and_tab_switches():
    metrics = {
        "tab_switch_count": 5,
        "total_hidden_duration": 40.0,
        "long_tab_switch_count": 3,
        "paste_count": 4,
        "large_paste_count": 3,
        "blur_count": 4,
        "characters_typed": 50,
        "paste_characters": 800,
        "session_duration_s": 900,
        "code_similarity_max": 0.4
    }
    score, level, reasons, anomaly = risk_engine.calculate_session_risk(metrics)
    assert score >= 50.0
    assert level in ("HIGH", "CRITICAL")
    assert any("large paste" in r.lower() for r in reasons)
    assert any("tab switch" in r.lower() for r in reasons)


def test_score_never_exceeds_100():
    # Overwhelming suspicious signals
    metrics = {
        "tab_switch_count": 50,
        "total_hidden_duration": 500.0,
        "long_tab_switch_count": 30,
        "paste_count": 30,
        "large_paste_count": 25,
        "blur_count": 40,
        "characters_typed": 0,
        "paste_characters": 5000,
        "session_duration_s": 600,
        "code_similarity_max": 0.99
    }
    score, level, reasons, anomaly = risk_engine.calculate_session_risk(metrics)
    assert score == 100.0
    assert level == "CRITICAL"
    assert score <= 100.0


def test_risk_level_boundaries():
    assert determine_risk_level(0.0) == "LOW"
    assert determine_risk_level(24.9) == "LOW"
    assert determine_risk_level(25.0) == "MEDIUM"
    assert determine_risk_level(49.9) == "MEDIUM"
    assert determine_risk_level(50.0) == "HIGH"
    assert determine_risk_level(74.9) == "HIGH"
    assert determine_risk_level(75.0) == "CRITICAL"
    assert determine_risk_level(100.0) == "CRITICAL"
