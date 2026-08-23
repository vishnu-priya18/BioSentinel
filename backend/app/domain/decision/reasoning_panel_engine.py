from typing import Dict, Any, List

class ReasoningPanelEngine:
    def build_why_checklist(
        self,
        object_name: str,
        confidence: float,
        category_info: Dict[str, Any],
        hazard_info: Dict[str, Any],
        decision_info: Dict[str, Any],
        evidence_info: Dict[str, Any]
    ) -> List[Dict[str, Any]]:

        checklist = []

        # Object Detection
        checklist.append({
            "status": "PASS" if object_name != "UNKNOWN_OBJECT" else "FAIL",
            "label": f"Object detected: {object_name.replace('_', ' ')}",
            "details": f"Class recognized from biomedical vocabulary."
        })

        # Vision Confidence
        checklist.append({
            "status": "PASS" if confidence >= 0.85 else ("WARN" if confidence >= 0.60 else "FAIL"),
            "label": f"Vision confidence: {round(confidence * 100, 1)}%",
            "details": "Threshold for automation is 85%."
        })

        # Category Mapping
        checklist.append({
            "status": "PASS" if category_info.get("code") != "UNKNOWN" else "FAIL",
            "label": f"Category stream: {category_info.get('bin_color')} / {category_info.get('name')}",
            "details": f"Mapped dynamically via waste_categories.json"
        })

        # Hazard Gate Evaluation
        is_sharp = hazard_info.get("is_sharp", False)
        checklist.append({
            "status": "FAIL" if is_sharp else "PASS",
            "label": f"Hazard Gate: {hazard_info.get('severity')} hazard ({'SHARP DETECTED' if is_sharp else 'NON-SHARP'})",
            "details": "Controlled handling forced for critical sharps."
        })

        # Multi-sensor Evidence
        conflict = evidence_info.get("conflict", False)
        checklist.append({
            "status": "FAIL" if conflict else "PASS",
            "label": f"Evidence reconciliation: {'CONFLICT DETECTED' if conflict else 'CONSISTENT'}",
            "details": evidence_info.get("summary", "No cross-sensor conflicts found.")
        })

        # Final Automation Allowed
        checklist.append({
            "status": "PASS" if decision_info.get("automation_allowed") else "FAIL",
            "label": f"Automated Disposal: {'ALLOWED' if decision_info.get('automation_allowed') else 'BLOCKED'}",
            "details": decision_info.get("reason")
        })

        return checklist
