import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.domain.compliance.waste_category_mapper import DeterministicWasteCategoryMapper
from backend.app.domain.safety.hazard_gate import HazardGate
from backend.app.domain.decision.policy_engine import PolicyEngine
from backend.app.domain.evidence.evidence_fusion_engine import EvidenceFusionEngine
from backend.app.domain.collection.routing_engine import RoutingEngine
from backend.app.domain.audit.audit_chain_service import AuditChainService
from backend.app.services.waste_service import WasteService

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

# TEST 1: SYRINGE
def test_syringe_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    hazard_gate = HazardGate()
    policy = PolicyEngine()
    evidence_engine = EvidenceFusionEngine()

    cat = mapper.get_category_for_object("syringe")
    assert cat["code"] == "WHITE"

    hazard = hazard_gate.evaluate_hazard("syringe")
    assert hazard["severity"] == "CRITICAL"
    assert hazard["is_sharp"] is True

    evidence = evidence_engine.fuse_evidence("WHITE", 0.96)
    decision = policy.evaluate_decision("syringe", 0.96, hazard, evidence)
    
    assert decision["automation_allowed"] is False
    assert decision["state"] == "HIGH_RISK_ESCALATION"

# TEST 2: NEEDLE
def test_needle_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    hazard_gate = HazardGate()
    policy = PolicyEngine()

    cat = mapper.get_category_for_object("needle")
    assert cat["code"] == "WHITE"

    hazard = hazard_gate.evaluate_hazard("needle")
    assert hazard["severity"] == "CRITICAL"

    decision = policy.evaluate_decision("needle", 0.99, hazard, {})
    assert decision["state"] == "HIGH_RISK_ESCALATION"

# TEST 3: SCALPEL
def test_scalpel_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    hazard_gate = HazardGate()
    policy = PolicyEngine()

    cat = mapper.get_category_for_object("scalpel")
    assert cat["code"] == "WHITE"

    hazard = hazard_gate.evaluate_hazard("scalpel")
    assert hazard["severity"] == "CRITICAL"

    decision = policy.evaluate_decision("scalpel", 0.95, hazard, {})
    assert decision["state"] == "HIGH_RISK_ESCALATION"

# TEST 4: BLOOD-STAINED GAUZE
def test_blood_gauze_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    cat = mapper.get_category_for_object("blood_stained_gauze")
    assert cat["code"] == "YELLOW"

# TEST 5: IV TUBE
def test_iv_tube_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    cat = mapper.get_category_for_object("iv_tube")
    assert cat["code"] == "RED"

# TEST 6: GLASS VIAL
def test_glass_vial_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    cat = mapper.get_category_for_object("glass_vial")
    assert cat["code"] == "BLUE"

# TEST 7: UNKNOWN OBJECT
def test_unknown_object_pipeline():
    mapper = DeterministicWasteCategoryMapper()
    policy = PolicyEngine()
    hazard = HazardGate().evaluate_hazard("unknown_object")
    
    cat = mapper.get_category_for_object("unknown_object")
    assert cat["code"] == "UNKNOWN"

    decision = policy.evaluate_decision("unknown_object", 0.0, hazard, {})
    assert decision["state"] == "UNKNOWN"
    assert decision["automation_allowed"] is False

# TEST 8: OPAQUE BAG
def test_opaque_bag_pipeline():
    policy = PolicyEngine()
    evidence_engine = EvidenceFusionEngine()
    hazard = HazardGate().evaluate_hazard("unknown_object")
    
    evidence = evidence_engine.fuse_evidence("UNKNOWN", 0.0, is_opaque_bag=True)
    assert evidence["missing"] is True

    decision = policy.evaluate_decision("unknown_object", 0.0, hazard, evidence, is_opaque_bag=True)
    assert decision["state"] == "UNKNOWN"
    assert decision["automation_allowed"] is False

# TEST 9: MULTIPLE OBJECTS (GAUZE + SYRINGE)
def test_multi_object_prioritization():
    hazard_gate = HazardGate()
    policy = PolicyEngine()

    detections = [
        {"class_name": "blood_stained_gauze", "confidence": 0.91},
        {"class_name": "syringe", "confidence": 0.94}
    ]

    # Prioritize critical sharp
    primary = detections[0]
    for d in detections:
        h = hazard_gate.evaluate_hazard(d["class_name"])
        if h.get("is_sharp", False):
            primary = d
            break

    assert primary["class_name"] == "syringe"
    hazard = hazard_gate.evaluate_hazard(primary["class_name"])
    decision = policy.evaluate_decision(primary["class_name"], primary["confidence"], hazard, {})
    
    assert decision["state"] == "HIGH_RISK_ESCALATION"
    assert decision["automation_allowed"] is False

# TEST 10: SYSTEM ERROR POLICY
def test_system_error_pipeline():
    policy = PolicyEngine()
    decision = policy.evaluate_decision("iv_tube", 0.95, {}, {}, model_installed=False)
    assert decision["state"] == "SYSTEM_ERROR"
    assert decision["automation_allowed"] is False

# CRITICAL INVARIANT TEST
def test_critical_safety_invariant():
    """
    CRITICAL INVARIANT:
    IF critical_hazard_detected == true
    THEN automation_allowed == false AND decision != SAFE_TO_AUTOMATE
    """
    hazard_gate = HazardGate()
    policy = PolicyEngine()

    critical_objects = ["syringe", "needle", "lancet", "scalpel", "blade", "sharp_medical_instrument", "broken_glass_medical_item"]

    for obj in critical_objects:
        hazard = hazard_gate.evaluate_hazard(obj)
        assert hazard["severity"] == "CRITICAL" or hazard["is_sharp"] is True

        decision = policy.evaluate_decision(obj, 0.99, hazard, {})

        assert decision["automation_allowed"] is False, f"FAILED for {obj}: automation_allowed must be False"
        assert decision["state"] != "SAFE_TO_AUTOMATE", f"FAILED for {obj}: decision state cannot be SAFE_TO_AUTOMATE"
