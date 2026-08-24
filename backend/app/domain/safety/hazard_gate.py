from typing import Dict, Any

class SafetyPolicyEngine:
    """
    Deterministic Safety Policy Engine for BioSentinel-X.
    
    SAFETY INVARIANT:
    AI Perception ≠ Operational Permission.
    For critical sharps (syringe, needle, scalpel, blade, lancet):
    - severity: CRITICAL
    - category: SHARPS (WHITE stream)
    - automation_allowed: False
    - decision: HUMAN_VERIFICATION_REQUIRED / HIGH_RISK_ESCALATION
    
    Even if AI confidence is 99.9%!
    """

    CRITICAL_SHARPS = {
        "syringe", "needle", "lancet", "scalpel", "blade", "sharp_medical_instrument",
        "broken_glass_medical_item", "sharp_unknown"
    }

    INFECTIOUS_OBJECTS = {
        "blood_stained_gauze", "blood_soaked_gauze", "cotton", "contaminated_cotton",
        "dressing", "bandage", "anatomical_waste", "pathological_waste", "infectious_waste",
        "blood_bag"
    }

    CONTAMINATED_PLASTICS = {
        "iv_tube", "iv_set", "catheter", "gloves", "glove", "plastic_container",
        "disposable_plastic_medical_item", "urine_bag", "tubing"
    }

    GLASS_OBJECTS = {
        "glass_vial", "medicine_vial", "vial", "medicine_bottle", "broken_glass",
        "glass_ampoule"
    }

    def evaluate_hazard(self, object_name: str) -> Dict[str, Any]:
        object_key = object_name.lower().strip()

        is_sharp = object_key in self.CRITICAL_SHARPS
        is_infectious = object_key in self.INFECTIOUS_OBJECTS
        is_plastic = object_key in self.CONTAMINATED_PLASTICS
        is_glass = object_key in self.GLASS_OBJECTS

        if is_sharp:
            severity = "CRITICAL"
            category_code = "WHITE"
            bin_stream = "WHITE"
            category_name = "SHARPS"
            automation_allowed = False
            decision_code = "HUMAN_VERIFICATION_REQUIRED"
        elif is_infectious:
            severity = "HIGH"
            category_code = "YELLOW"
            bin_stream = "YELLOW"
            category_name = "INFECTIOUS"
            automation_allowed = False
            decision_code = "HUMAN_VERIFICATION_REQUIRED"
        elif is_glass:
            severity = "HIGH"
            category_code = "BLUE"
            bin_stream = "BLUE"
            category_name = "GLASS"
            automation_allowed = False
            decision_code = "CONTROLLED_ROUTE"
        elif is_plastic:
            severity = "MODERATE"
            category_code = "RED"
            bin_stream = "RED"
            category_name = "CONTAMINATED_PLASTIC"
            automation_allowed = True # Subject to confidence threshold check
            decision_code = "SAFE_TO_AUTOMATE"
        elif object_key == "unknown_object" or object_key == "unknown_medical_waste":
            severity = "HIGH"
            category_code = "UNKNOWN"
            bin_stream = "UNKNOWN"
            category_name = "UNKNOWN"
            automation_allowed = False
            decision_code = "MANUAL_INSPECTION_REQUIRED"
        else:
            severity = "LOW"
            category_code = "BLACK"
            bin_stream = "BLACK"
            category_name = "GENERAL"
            automation_allowed = True
            decision_code = "SAFE_TO_AUTOMATE"

        return {
            "detected": True,
            "type": object_name.upper(),
            "severity": severity,
            "category_code": category_code,
            "bin_stream": bin_stream,
            "category_name": category_name,
            "is_sharp": is_sharp,
            "is_infectious": is_infectious,
            "is_plastic": is_plastic,
            "is_glass": is_glass,
            "automation_allowed": automation_allowed,
            "decision_code": decision_code
        }

# Alias for backward compatibility
HazardGate = SafetyPolicyEngine
