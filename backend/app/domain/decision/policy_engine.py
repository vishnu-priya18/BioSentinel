from typing import Dict, Any

class PolicyEngine:
    """
    Deterministic Safety Policy Engine.
    Strict Order of Evaluation:
    1. SYSTEM_ERROR
    2. CRITICAL_HAZARD (Syringe, Needle, Scalpel, Blade, Lancet, Sharp Instrument)
    3. CRITICAL_CONFLICT (Barcode vs Vision Mismatch)
    4. HIGH_OPERATIONAL_RISK (Extreme Weight Anomaly)
    5. NOT_OBSERVABLE / CRITICAL_MISSING (Opaque Bag / Unknown Object)
    6. HIGH_UNCERTAINTY (Confidence < 0.50)
    7. MODERATE_UNCERTAINTY (Confidence 0.50 - 0.80)
    8. SAFE_TO_AUTOMATE (Confidence >= 0.80, Non-Sharp, Zero Conflict)
    """

    def evaluate_decision(
        self,
        object_name: str,
        confidence: float,
        hazard_info: Dict[str, Any],
        evidence_info: Dict[str, Any],
        is_opaque_bag: bool = False,
        model_installed: bool = True
    ) -> Dict[str, Any]:

        object_key = object_name.lower().strip()

        # 1. SYSTEM ERROR
        if not model_installed:
            return {
                "state": "SYSTEM_ERROR",
                "automation_allowed": False,
                "reason": "Biomedical vision model is not installed on system."
            }

        # 2. CRITICAL HAZARD GATE (SYRINGE, NEEDLE, SCALPEL, BLADE, LANCET)
        if hazard_info.get("is_sharp", False) or hazard_info.get("severity") == "CRITICAL":
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "reason": f"Critical sharp medical object detected ({object_name}). Controlled human handling forced."
            }

        # 3. CRITICAL CONFLICT
        if evidence_info.get("conflict", False):
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "reason": f"Critical evidence conflict detected: {evidence_info.get('summary', 'Cross-Sensor Mismatch')}"
            }

        # 4. HIGH OPERATIONAL RISK (Weight Anomaly)
        weight_val = evidence_info.get("details", {}).get("weight_kg") or 0.0
        if weight_val > 5.0 and hazard_info.get("is_infectious", False):
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "reason": "High operational risk: Excessive payload weight for bio-infectious stream."
            }

        # 5. NOT OBSERVABLE / CRITICAL MISSING
        if is_opaque_bag or object_key == "unknown_object":
            return {
                "state": "UNKNOWN",
                "automation_allowed": False,
                "reason": "Contents are not observable or object could not be identified safely."
            }

        # 6. HIGH UNCERTAINTY (Confidence < 0.50)
        if confidence < 0.50:
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "reason": f"High AI uncertainty ({round(confidence*100, 1)}% confidence is below 50% safety floor)."
            }

        # 7. MODERATE UNCERTAINTY (Confidence 0.50 - 0.80)
        if confidence < 0.80:
            return {
                "state": "NEEDS_VERIFICATION",
                "automation_allowed": False,
                "reason": f"Moderate confidence ({round(confidence*100, 1)}%). Secondary human verification required."
            }

        # 8. SAFE TO AUTOMATE (ONLY IF ZERO CRITICAL HAZARD AND ZERO CONFLICT)
        return {
            "state": "SAFE_TO_AUTOMATE",
            "automation_allowed": True,
            "reason": f"Clear visual evidence ({round(confidence*100, 1)}%), valid category mapping, low uncertainty, no critical hazard detected."
        }
