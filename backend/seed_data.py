import os
import sys
import json
import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.assessment import Assessment, Question
from app.models.session import AssessmentSession, Event
from app.models.submission import Submission, SimilarityResult
from app.models.risk_rule import RiskRule
from app.utils.security import hash_password
from app.services.similarity import analyze_code_similarity


def seed_database():
    print("Seeding database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing tables if any
    db.query(SimilarityResult).delete()
    db.query(Submission).delete()
    db.query(Event).delete()
    db.query(AssessmentSession).delete()
    db.query(Question).delete()
    db.query(Assessment).delete()
    db.query(RiskRule).delete()
    db.query(User).delete()
    db.commit()

    # 1. Create Users
    print("Creating admin and candidates...")
    admin = User(
        name="Sarah Connor (Lead Evaluator)",
        email="admin@interview.ai",
        password_hash=hash_password("AdminPass123!"),
        role="admin",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
    )
    db.add(admin)

    candidates = [
        User(name="Alice Smith", email="alice@candidate.com", password_hash=hash_password("CandidatePass123!"), role="candidate", created_at=datetime.datetime.utcnow() - datetime.timedelta(days=5)),
        User(name="Bob Johnson", email="bob@candidate.com", password_hash=hash_password("CandidatePass123!"), role="candidate", created_at=datetime.datetime.utcnow() - datetime.timedelta(days=5)),
        User(name="Charlie Brown", email="charlie@candidate.com", password_hash=hash_password("CandidatePass123!"), role="candidate", created_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)),
        User(name="Diana Prince", email="diana@candidate.com", password_hash=hash_password("CandidatePass123!"), role="candidate", created_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)),
        User(name="Evan Davis", email="evan@candidate.com", password_hash=hash_password("CandidatePass123!"), role="candidate", created_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)),
    ]
    db.add_all(candidates)
    db.commit()
    db.refresh(admin)
    for c in candidates:
        db.refresh(c)

    # 2. Create Risk Rules
    print("Creating default risk rules...")
    rules = [
        RiskRule(rule_name="TAB_SWITCH", weight=5.0, threshold=1.0, enabled=True),
        RiskRule(rule_name="LONG_TAB_SWITCH", weight=10.0, threshold=5.0, enabled=True),
        RiskRule(rule_name="LARGE_PASTE", weight=10.0, threshold=300.0, enabled=True),
        RiskRule(rule_name="REPEATED_LARGE_PASTE", weight=15.0, threshold=2.0, enabled=True),
        RiskRule(rule_name="TYPING_ANOMALY", weight=10.0, threshold=0.70, enabled=True),
        RiskRule(rule_name="CODE_SIMILARITY", weight=25.0, threshold=0.75, enabled=True),
        RiskRule(rule_name="MULTI_SIGNAL", weight=10.0, threshold=3.0, enabled=True),
    ]
    db.add_all(rules)
    db.commit()

    # 3. Create Assessments and Questions
    print("Creating assessments and questions...")
    a1 = Assessment(
        title="Algorithms & Problem Solving (Python)",
        description="Comprehensive technical evaluation assessing algorithmic thinking, data structures, and clean coding practices in Python.",
        duration=60,
        difficulty="Medium",
        created_by=admin.id
    )
    a2 = Assessment(
        title="Data Structures & Optimization",
        description="Focused assessment testing efficiency, time complexity tradeoffs, stack/queue operations, and pointer manipulation.",
        duration=45,
        difficulty="Hard",
        created_by=admin.id
    )
    a3 = Assessment(
        title="Full-Stack JavaScript Essentials",
        description="Core JavaScript and frontend/backend asynchronous logic questions.",
        duration=45,
        difficulty="Easy",
        created_by=admin.id
    )
    db.add_all([a1, a2, a3])
    db.commit()
    db.refresh(a1)
    db.refresh(a2)
    db.refresh(a3)

    q1 = Question(
        assessment_id=a1.id,
        title="Two Sum Problem",
        description="""Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Constraints:
* 2 <= nums.length <= 10^4
* -10^9 <= nums[i] <= 10^9
* Only one valid answer exists.""",
        starter_code="""def two_sum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
""",
        language="python",
        time_limit=25
    )

    q2 = Question(
        assessment_id=a1.id,
        title="Valid Palindrome",
        description="""A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string `s`, return `True` if it is a palindrome, or `False` otherwise.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: True
Explanation: "amanaplanacanalpanama" is a palindrome.""",
        starter_code="""def is_palindrome(s: str) -> bool:
    # Write your solution here
    pass
""",
        language="python",
        time_limit=20
    )

    q3 = Question(
        assessment_id=a2.id,
        title="Valid Parentheses",
        description="""Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
Open brackets must be closed by the same type of brackets and in the correct order.""",
        starter_code="""def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack
""",
        language="python",
        time_limit=25
    )

    db.add_all([q1, q2, q3])
    db.commit()
    db.refresh(q1)
    db.refresh(q2)
    db.refresh(q3)

    # 4. Create Sessions with Diverse Risk Profiles
    print("Creating candidate sessions with varied risk tiers...")
    now = datetime.datetime.utcnow()

    # Session 1: Alice Smith -> LOW Risk (Genuine, normal typing, 0 tab switch)
    s1 = AssessmentSession(
        candidate_id=candidates[0].id,
        assessment_id=a1.id,
        started_at=now - datetime.timedelta(minutes=45),
        ended_at=now - datetime.timedelta(minutes=5),
        status="completed",
        risk_score=12.0,
        risk_level="LOW",
        behavior_anomaly_score=10.0,
        risk_reasons=json.dumps([
            "Assessment session activity is within expected normal parameters.",
            "Normal typing cadence and interactive problem-solving observed."
        ]),
        tab_switch_count=1,
        total_hidden_duration=2.1,
        paste_count=1,
        large_paste_count=0,
        blur_count=1,
        total_blur_duration=3.0,
        code_similarity_max=0.35
    )

    # Session 2: Bob Johnson -> MEDIUM Risk (3 tab switches, moderate paste)
    s2 = AssessmentSession(
        candidate_id=candidates[1].id,
        assessment_id=a1.id,
        started_at=now - datetime.timedelta(minutes=50),
        ended_at=now - datetime.timedelta(minutes=10),
        status="completed",
        risk_score=38.0,
        risk_level="MEDIUM",
        behavior_anomaly_score=32.0,
        risk_reasons=json.dumps([
            "3 tab switches detected (total 14.5s hidden, avg 4.8s).",
            "1 prolonged absence (>5s) away from assessment window.",
            "Moderate paste operations recorded."
        ]),
        tab_switch_count=3,
        total_hidden_duration=14.5,
        paste_count=3,
        large_paste_count=1,
        blur_count=3,
        total_blur_duration=18.0,
        code_similarity_max=0.48
    )

    # Session 3: Charlie Brown -> HIGH Risk (6 tab switches, 2 large pastes, 82% code similarity)
    s3 = AssessmentSession(
        candidate_id=candidates[2].id,
        assessment_id=a1.id,
        started_at=now - datetime.timedelta(minutes=30),
        ended_at=None,
        status="active",
        risk_score=68.5,
        risk_level="HIGH",
        behavior_anomaly_score=58.0,
        risk_reasons=json.dumps([
            "6 tab switches detected (total 42.0s hidden, avg 7.0s).",
            "3 prolonged absences (>5s) away from assessment window.",
            "2 large paste operations (>300 characters) recorded.",
            "High code similarity (82.4%) detected compared with another candidate's submission.",
            "Correlation bonus: Multiple distinct suspicious vectors (4 indicators) occurred in session."
        ]),
        tab_switch_count=6,
        total_hidden_duration=42.0,
        paste_count=4,
        large_paste_count=2,
        blur_count=5,
        total_blur_duration=48.0,
        code_similarity_max=0.82
    )

    # Session 4: Diana Prince -> CRITICAL Risk (11 tab switches, 4 large pastes, zero typing, 94% similarity)
    s4 = AssessmentSession(
        candidate_id=candidates[3].id,
        assessment_id=a1.id,
        started_at=now - datetime.timedelta(minutes=25),
        ended_at=None,
        status="active",
        risk_score=89.0,
        risk_level="CRITICAL",
        behavior_anomaly_score=84.0,
        risk_reasons=json.dumps([
            "11 tab switches detected (total 86.4s hidden, avg 7.8s).",
            "5 prolonged absences (>5s) away from assessment window.",
            "4 large paste operations (>300 characters) recorded.",
            "High paste-to-typing ratio (91% of submitted characters originated from clipboard pastes).",
            "High code similarity (94.1%) detected compared with another candidate's submission.",
            "Correlation bonus: Multiple distinct suspicious vectors (5 indicators) occurred in session.",
            "Behavioral ML anomaly model flagged typing/interaction distribution (anomaly index 84)."
        ]),
        tab_switch_count=11,
        total_hidden_duration=86.4,
        paste_count=6,
        large_paste_count=4,
        blur_count=9,
        total_blur_duration=92.0,
        code_similarity_max=0.94
    )

    # Session 5: Evan Davis -> LOW Risk
    s5 = AssessmentSession(
        candidate_id=candidates[4].id,
        assessment_id=a2.id,
        started_at=now - datetime.timedelta(minutes=20),
        ended_at=None,
        status="active",
        risk_score=8.0,
        risk_level="LOW",
        behavior_anomaly_score=5.0,
        risk_reasons=json.dumps([
            "Assessment session activity is within expected normal parameters."
        ]),
        tab_switch_count=0,
        total_hidden_duration=0.0,
        paste_count=0,
        large_paste_count=0,
        blur_count=0,
        total_blur_duration=0.0,
        code_similarity_max=0.20
    )

    db.add_all([s1, s2, s3, s4, s5])
    db.commit()
    for s in [s1, s2, s3, s4, s5]:
        db.refresh(s)

    # 5. Populate Realistic Events for Sessions
    print("Generating timeline events...")
    events_data = [
        # Session 1 events (Alice)
        Event(session_id=s1.id, event_type="SESSION_START", timestamp=s1.started_at, severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"info": "Session started"})),
        Event(session_id=s1.id, event_type="TYPING_UPDATE", timestamp=s1.started_at + datetime.timedelta(minutes=5), severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"characters_typed": 120, "characters_deleted": 15})),
        Event(session_id=s1.id, event_type="TAB_SWITCH", timestamp=s1.started_at + datetime.timedelta(minutes=15), severity="LOW", score_contribution=4.0, metadata_json=json.dumps({"duration": 2.1})),
        Event(session_id=s1.id, event_type="PASTE", timestamp=s1.started_at + datetime.timedelta(minutes=20), severity="LOW", score_contribution=1.0, metadata_json=json.dumps({"character_count": 35})),
        Event(session_id=s1.id, event_type="CODE_RUN", timestamp=s1.started_at + datetime.timedelta(minutes=25), severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"status": "success", "runtime_ms": 14.2})),
        Event(session_id=s1.id, event_type="SUBMISSION", timestamp=s1.started_at + datetime.timedelta(minutes=38), severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"question_id": q1.id})),
        Event(session_id=s1.id, event_type="SESSION_FINISH", timestamp=s1.ended_at, severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"final_risk": 12.0})),

        # Session 3 events (Charlie - HIGH)
        Event(session_id=s3.id, event_type="SESSION_START", timestamp=s3.started_at, severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"info": "Session started"})),
        Event(session_id=s3.id, event_type="TAB_SWITCH", timestamp=s3.started_at + datetime.timedelta(minutes=4), severity="MEDIUM", score_contribution=7.0, metadata_json=json.dumps({"duration": 6.8})),
        Event(session_id=s3.id, event_type="WINDOW_BLUR", timestamp=s3.started_at + datetime.timedelta(minutes=8), severity="MEDIUM", score_contribution=5.0, metadata_json=json.dumps({"duration": 8.5})),
        Event(session_id=s3.id, event_type="PASTE", timestamp=s3.started_at + datetime.timedelta(minutes=12), severity="HIGH", score_contribution=12.0, metadata_json=json.dumps({"character_count": 380})),
        Event(session_id=s3.id, event_type="TAB_SWITCH", timestamp=s3.started_at + datetime.timedelta(minutes=16), severity="HIGH", score_contribution=10.0, metadata_json=json.dumps({"duration": 12.4})),
        Event(session_id=s3.id, event_type="PASTE", timestamp=s3.started_at + datetime.timedelta(minutes=19), severity="HIGH", score_contribution=15.0, metadata_json=json.dumps({"character_count": 420})),
        Event(session_id=s3.id, event_type="HIGH_CODE_SIMILARITY", timestamp=s3.started_at + datetime.timedelta(minutes=22), severity="HIGH", score_contribution=25.0, metadata_json=json.dumps({"similarity_score": 0.824})),

        # Session 4 events (Diana - CRITICAL)
        Event(session_id=s4.id, event_type="SESSION_START", timestamp=s4.started_at, severity="LOW", score_contribution=0.0, metadata_json=json.dumps({"info": "Session started"})),
        Event(session_id=s4.id, event_type="TAB_SWITCH", timestamp=s4.started_at + datetime.timedelta(minutes=2), severity="HIGH", score_contribution=10.0, metadata_json=json.dumps({"duration": 15.2})),
        Event(session_id=s4.id, event_type="PASTE", timestamp=s4.started_at + datetime.timedelta(minutes=5), severity="HIGH", score_contribution=12.0, metadata_json=json.dumps({"character_count": 512})),
        Event(session_id=s4.id, event_type="TAB_SWITCH", timestamp=s4.started_at + datetime.timedelta(minutes=7), severity="HIGH", score_contribution=10.0, metadata_json=json.dumps({"duration": 18.0})),
        Event(session_id=s4.id, event_type="PASTE", timestamp=s4.started_at + datetime.timedelta(minutes=10), severity="HIGH", score_contribution=15.0, metadata_json=json.dumps({"character_count": 680})),
        Event(session_id=s4.id, event_type="TYPING_BURST", timestamp=s4.started_at + datetime.timedelta(minutes=13), severity="HIGH", score_contribution=10.0, metadata_json=json.dumps({"characters_per_second": 24.5})),
        Event(session_id=s4.id, event_type="HIGH_CODE_SIMILARITY", timestamp=s4.started_at + datetime.timedelta(minutes=18), severity="HIGH", score_contribution=25.0, metadata_json=json.dumps({"similarity_score": 0.941})),
    ]
    db.add_all(events_data)
    db.commit()

    # 6. Create Submissions and Cross-Similarity Results
    print("Creating code submissions and similarity matrix...")
    code_alice = """def two_sum(nums, target):
    # Hash map approach
    mapping = {}
    for idx, val in enumerate(nums):
        diff = target - val
        if diff in mapping:
            return [mapping[diff], idx]
        mapping[val] = idx
    return []
"""

    code_charlie = """def two_sum(numbers, target_sum):
    lookup = {}
    for i, n in enumerate(numbers):
        complement = target_sum - n
        if complement in lookup:
            return [lookup[complement], i]
        lookup[n] = i
    return []
"""

    code_diana = """def two_sum(nums, target):
    seen = {}
    for i in range(len(nums)):
        remain = target - nums[i]
        if remain in seen:
            return [seen[remain], i]
        seen[nums[i]] = i
    return []
"""

    sub1 = Submission(session_id=s1.id, question_id=q1.id, code=code_alice, language="python", submitted_at=s1.started_at + datetime.timedelta(minutes=35))
    sub3 = Submission(session_id=s3.id, question_id=q1.id, code=code_charlie, language="python", submitted_at=s3.started_at + datetime.timedelta(minutes=21))
    sub4 = Submission(session_id=s4.id, question_id=q1.id, code=code_diana, language="python", submitted_at=s4.started_at + datetime.timedelta(minutes=17))
    db.add_all([sub1, sub3, sub4])
    db.commit()
    db.refresh(sub1)
    db.refresh(sub3)
    db.refresh(sub4)

    # Analyze cross similarity
    pairs = [(sub1, sub3), (sub1, sub4), (sub3, sub4)]
    for a, b in pairs:
        res = analyze_code_similarity(a.code, b.code, language="python")
        sim_a = SimilarityResult(
            submission_id=a.id,
            compared_submission_id=b.id,
            similarity_score=res["similarity_score"],
            method=res["method"],
            created_at=datetime.datetime.utcnow()
        )
        sim_b = SimilarityResult(
            submission_id=b.id,
            compared_submission_id=a.id,
            similarity_score=res["similarity_score"],
            method=res["method"],
            created_at=datetime.datetime.utcnow()
        )
        db.add_all([sim_a, sim_b])
    db.commit()

    print("\nDatabase successfully seeded!")
    print(f"Admin: admin@interview.ai / AdminPass123!")
    print(f"Candidate Alice (LOW): alice@candidate.com / CandidatePass123!")
    print(f"Candidate Charlie (HIGH): charlie@candidate.com / CandidatePass123!")
    print(f"Candidate Diana (CRITICAL): diana@candidate.com / CandidatePass123!")
    db.close()


if __name__ == "__main__":
    seed_database()
