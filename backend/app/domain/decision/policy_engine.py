from typing import Dict, Any

class PolicyEngine:
    """
    Deterministic Safety Policy Engine for BioSentinel-X.
    
    Order of Evaluation:
    1. SYSTEM_ERROR (Model unavailable / Inference failure)
    2. CRITICAL HAZARD GATE (Syringe, Needle, Scalpel, Blade, Lancet) -> HIGH_RISK_ESCALATION / HUMAN_VERIFICATION_REQUIRED
    3. CRITICAL CONFLICT (Barcode vs Vision Mismatch)
    4. HIGH OPERATIONAL RISK (Excessive Payload Weight)
    5. NOT OBSERVABLE / UNKNOWN OBJECT -> MANUAL_INSPECTION_REQUIRED
    6. HIGH UNCERTAINTY (Confidence < 50%) -> HUMAN_VERIFICATION_REQUIRED
    7. MODERATE UNCERTAINTY (Confidence 50% - 80%) -> NEEDS_VERIFICATION
    8. SAFE TO AUTOMATE (Confidence >= 80%, Non-Sharp, Non-Infectious, Zero Conflict)
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

        # 1. SYSTEM ERROR (Inference Failure)
        if not model_installed:
            return {
                "state": "SYSTEM_ERROR",
                "automation_allowed": False,
                "decision": "MANUAL_INSPECTION_REQUIRED",
                "reason": "Biomedical vision inference service unavailable. Manual inspection required."
            }

        # 2. CRITICAL HAZARD GATE (SYRINGE, NEEDLE, SCALPEL, BLADE, LANCET)
        if hazard_info.get("is_sharp", False) or hazard_info.get("severity") == "CRITICAL":
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "decision": "HUMAN_VERIFICATION_REQUIRED",
                "reason": f"Critical sharp medical object detected ({object_name.upper()}). High AI confidence ({round(confidence*100, 1)}%) CANNOT override critical safety rules. Mandatory human verification forced."
            }

        # 3. INFECTIOUS HAZARD
        if hazard_info.get("is_infectious", False):
            return {
                "state": "NEEDS_VERIFICATION",
                "automation_allowed": False,
                "decision": "HUMAN_VERIFICATION_REQUIRED",
                "reason": f"Bio-infectious waste item detected ({object_name.upper()}). Routed to Yellow Stream. Secondary human verification required."
            }

        # 4. CRITICAL CONFLICT
        if evidence_info.get("conflict", False):
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "decision": "HUMAN_VERIFICATION_REQUIRED",
                "reason": f"Critical evidence conflict detected: {evidence_info.get('summary', 'Cross-Sensor Mismatch')}"
            }

        # 5. HIGH OPERATIONAL RISK (Weight Anomaly)
        weight_val = evidence_info.get("details", {}).get("weight_kg") or 0.0
        if weight_val > 5.0 and hazard_info.get("is_infectious", False):
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "decision": "HUMAN_VERIFICATION_REQUIRED",
                "reason": "High operational risk: Excessive payload weight for bio-infectious stream."
            }

        # 6. NOT OBSERVABLE / UNKNOWN OBJECT
        if is_opaque_bag or object_key == "unknown_object" or object_key == "unknown_medical_waste":
            return {
                "state": "UNKNOWN",
                "automation_allowed": False,
                "decision": "MANUAL_INSPECTION_REQUIRED",
                "reason": "Container contents are not observable or object could not be safely identified. Manual inspection forced."
            }

        # 7. HIGH UNCERTAINTY (Confidence < 0.50)
        if confidence < 0.50:
            return {
                "state": "HIGH_RISK_ESCALATION",
                "automation_allowed": False,
                "decision": "HUMAN_VERIFICATION_REQUIRED",
                "reason": f"High AI uncertainty ({round(confidence*100, 1)}% confidence is below 50% safety floor)."
            }

        # 8. MODERATE UNCERTAINTY (Confidence 0.50 - 0.80)
        if confidence < 0.80:
            return {
                "state": "NEEDS_VERIFICATION",
                "automation_allowed": False,
                "decision": "HUMAN_VERIFICATION_REQUIRED",
                "reason": f"Moderate confidence ({round(confidence*100, 1)}%). Secondary human verification required before bin routing."
            }

        # 9. SAFE TO AUTOMATE (ONLY IF ZERO CRITICAL HAZARD, ZERO CONFLICT, CONFIDENCE >= 80%)
        return {
            "state": "SAFE_TO_AUTOMATE",
            "automation_allowed": True,
            "decision": "AUTOMATION_ALLOWED",
            "reason": f"Clear visual evidence ({round(confidence*100, 1)}%), low hazard category, no conflict. Automated bin routing permitted."
        }
