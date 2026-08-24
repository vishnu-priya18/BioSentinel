import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.domain.safety.hazard_gate import SafetyPolicyEngine
from backend.app.domain.decision.policy_engine import PolicyEngine
from backend.app.domain.audit.audit_chain_service import AuditChainService
from backend.app.services.waste_service import WasteService
from backend.app.models.models import WasteItem, WastePassport, CollectionTask, AuditHashChain

# In-memory test database
TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_syringe_critical_safety_invariant():
    """
    TEST 1: SYRINGE SAFETY INVARIANT
    Syringe MUST evaluate to CRITICAL, WHITE, automation_allowed=False, decision=HUMAN_VERIFICATION_REQUIRED,
    even at 99.9% confidence.
    """
    safety_engine = SafetyPolicyEngine()
    policy_engine = PolicyEngine()

    hazard = safety_engine.evaluate_hazard("syringe")
    assert hazard["is_sharp"] is True
    assert hazard["severity"] == "CRITICAL"
    assert hazard["category_code"] == "WHITE"
    assert hazard["automation_allowed"] is False

    decision = policy_engine.evaluate_decision(
        object_name="syringe",
        confidence=0.999, # 99.9% confidence
        hazard_info=hazard,
        evidence_info={"conflict": False, "details": {}},
        is_opaque_bag=False,
        model_installed=True
    )

    assert decision["automation_allowed"] is False
    assert decision["decision"] == "HUMAN_VERIFICATION_REQUIRED"
    assert decision["state"] == "HIGH_RISK_ESCALATION"

def test_needle_critical_safety_invariant():
    """
    TEST 2: NEEDLE SAFETY INVARIANT
    Needle MUST evaluate to CRITICAL, WHITE, automation_allowed=False.
    """
    safety_engine = SafetyPolicyEngine()
    policy_engine = PolicyEngine()

    hazard = safety_engine.evaluate_hazard("needle")
    assert hazard["is_sharp"] is True
    assert hazard["severity"] == "CRITICAL"
    assert hazard["category_code"] == "WHITE"

    decision = policy_engine.evaluate_decision(
        object_name="needle",
        confidence=0.95,
        hazard_info=hazard,
        evidence_info={"conflict": False, "details": {}},
        is_opaque_bag=False,
        model_installed=True
    )

    assert decision["automation_allowed"] is False
    assert decision["decision"] == "HUMAN_VERIFICATION_REQUIRED"

def test_unknown_object_manual_inspection():
    """
    TEST 3: UNKNOWN OBJECT SAFETY
    Unknown object MUST evaluate to MANUAL_INSPECTION_REQUIRED and automation_allowed=False.
    """
    safety_engine = SafetyPolicyEngine()
    policy_engine = PolicyEngine()

    hazard = safety_engine.evaluate_hazard("unknown_object")
    assert hazard["automation_allowed"] is False

    decision = policy_engine.evaluate_decision(
        object_name="unknown_object",
        confidence=0.10,
        hazard_info=hazard,
        evidence_info={"conflict": False, "details": {}},
        is_opaque_bag=False,
        model_installed=True
    )

    assert decision["automation_allowed"] is False
    assert decision["decision"] == "MANUAL_INSPECTION_REQUIRED"

def test_sha256_audit_chain_verification(db_session):
    """
    TEST 4: SHA-256 AUDIT HASH CHAIN RECOMPUTATION
    Creates multiple event blocks, recomputes hashes, and asserts chain integrity is VALID.
    """
    audit_service = AuditChainService()

    block1 = audit_service.add_event(db_session, "TEST_EVENT_1", {"key": "val1"})
    block2 = audit_service.add_event(db_session, "TEST_EVENT_2", {"key": "val2"})

    assert block1.sequence_number == 1
    assert block2.sequence_number == 2
    assert block2.previous_hash == block1.current_hash

    res = audit_service.verify_chain(db_session)
    assert res["is_valid"] is True
    assert "✓ HASH CHAIN VALID" in res["message"]

def test_passport_persistence_and_collection_update(db_session):
    """
    TEST 5 & 6: PASSPORT PERSISTENCE AND COLLECTION TASK UPDATE
    Registers a waste item, creates passport, verifies task creation, and confirms completion.
    """
    waste_service = WasteService()

    passport = waste_service.register_waste_item(
        db=db_session,
        object_type="SYRINGE",
        category_code="WHITE",
        department_name="ICU",
        weight_kg=0.35
    )

    assert passport.waste_id.startswith("MW-2026-")
    assert passport.category == "WHITE"
    assert passport.current_status == "VERIFICATION_REQUIRED"

    # Verify task was auto-created in database
    task = db_session.query(CollectionTask).filter(CollectionTask.waste_id == passport.waste_id).first()
    assert task is not None
    assert task.status == "PENDING"

    # Complete collection task
    task.status = "COMPLETED"
    passport.current_status = "COLLECTED"
    db_session.commit()

    updated_passport = db_session.query(WastePassport).filter(WastePassport.waste_id == passport.waste_id).first()
    assert updated_passport.current_status == "COLLECTED"

def test_canonical_yolo_detector_status():
    """
    TEST 7: CANONICAL DETECTOR STATUS
    Asserts CanonicalYoloWasteDetector returns structured status and class vocabulary.
    """
    from backend.app.domain.intelligence.yolo_detector import CanonicalYoloWasteDetector
    detector = CanonicalYoloWasteDetector()
    status_info = detector.get_status()

    assert "status" in status_info
    assert "model_path" in status_info
    assert "device" in status_info
    assert "confidence_threshold" in status_info
    assert status_info["confidence_threshold"] == 0.40

if __name__ == "__main__":
    pytest.main(["-v", __file__])
