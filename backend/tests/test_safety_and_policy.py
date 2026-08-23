import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.domain.compliance.waste_category_mapper import DeterministicWasteCategoryMapper
from backend.app.domain.compliance.waste_stream_mapper import WasteStreamMapper
from backend.app.domain.safety.hazard_gate import HazardGate
from backend.app.domain.decision.policy_engine import PolicyEngine
from backend.app.domain.evidence.evidence_fusion_engine import EvidenceFusionEngine
from backend.ml.inference.detector import BiomedicalWasteDetector

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

# TEST 1: SYRINGE IMAGE & HAZARD OVERRIDE
def test_syringe_detection_pipeline():
    mapper = WasteStreamMapper()
    hazard_gate = HazardGate()
    policy = PolicyEngine()

    stream_info = mapper.map_object_to_stream("syringe")
    assert stream_info["stream"] == "WHITE"

    hazard_info = hazard_gate.evaluate_hazard("syringe")
    assert hazard_info["severity"] == "CRITICAL"
    assert hazard_info["is_sharp"] is True

    decision = policy.evaluate_decision("syringe", 0.97, hazard_info, {})
    assert decision["state"] == "HIGH_RISK_ESCALATION"
    assert decision["automation_allowed"] is False

# TEST 2: NEEDLE IMAGE
def test_needle_detection_pipeline():
    mapper = WasteStreamMapper()
    hazard_gate = HazardGate()
    policy = PolicyEngine()

    stream_info = mapper.map_object_to_stream("needle")
    assert stream_info["stream"] == "WHITE"

    hazard_info = hazard_gate.evaluate_hazard("needle")
    assert hazard_info["is_sharp"] is True

    decision = policy.evaluate_decision("needle", 0.99, hazard_info, {})
    assert decision["state"] == "HIGH_RISK_ESCALATION"

# TEST 3: IV SET / IV TUBE IMAGE
def test_iv_set_detection_pipeline():
    mapper = WasteStreamMapper()
    stream_info = mapper.map_object_to_stream("iv_set")
    assert stream_info["stream"] == "RED"

# TEST 4: BLOOD SOAKED GAUZE IMAGE
def test_blood_soaked_gauze_pipeline():
    mapper = WasteStreamMapper()
    stream_info = mapper.map_object_to_stream("blood_soaked_gauze")
    assert stream_info["stream"] == "YELLOW"

# TEST 5: GLASS VIAL IMAGE
def test_glass_vial_pipeline():
    mapper = WasteStreamMapper()
    stream_info = mapper.map_object_to_stream("glass_vial")
    assert stream_info["stream"] == "BLUE"

# TEST 6: OPAQUE BAG CONTAINER
def test_opaque_bag_pipeline():
    policy = PolicyEngine()
    evidence_engine = EvidenceFusionEngine()
    hazard = HazardGate().evaluate_hazard("opaque_bag")

    evidence = evidence_engine.fuse_evidence("UNKNOWN", 0.0, is_opaque_bag=True)
    assert evidence["missing"] is True

    decision = policy.evaluate_decision("opaque_bag", 0.0, hazard, evidence, is_opaque_bag=True)
    assert decision["state"] == "UNKNOWN"
    assert decision["automation_allowed"] is False

# TEST 7: UNKNOWN OBJECT
def test_unknown_object_pipeline():
    policy = PolicyEngine()
    hazard = HazardGate().evaluate_hazard("unknown_object")
    decision = policy.evaluate_decision("unknown_object", 0.0, hazard, {})

    assert decision["state"] == "UNKNOWN"
    assert decision["automation_allowed"] is False

# TEST 8: NO OBJECT DETECTED (NEVER DEFAULT TO YELLOW)
def test_no_object_detected_pipeline():
    mapper = WasteStreamMapper()
    stream_info = mapper.map_object_to_stream("unknown_object")
    assert stream_info["stream"] == "UNKNOWN"
    assert stream_info["stream"] != "YELLOW"

# HARD SAFETY INVARIANT
def test_hard_safety_invariant():
    """
    CRITICAL HARD SAFETY INVARIANT:
    IF critical_hazard_detected == true
    THEN automation_allowed == false AND decision != SAFE_TO_AUTOMATE
    """
    hazard_gate = HazardGate()
    policy = PolicyEngine()
    critical_sharps = ["syringe", "needle", "scalpel", "blade", "lancet"]

    for obj in critical_sharps:
        hazard = hazard_gate.evaluate_hazard(obj)
        assert hazard["severity"] == "CRITICAL" or hazard["is_sharp"] is True

        decision = policy.evaluate_decision(obj, 0.99, hazard, {})
        assert decision["automation_allowed"] is False
        assert decision["state"] != "SAFE_TO_AUTOMATE"
