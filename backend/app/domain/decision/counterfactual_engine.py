from typing import Dict, Any, List

class CounterfactualEngine:
    """
    Explains what evidence or state changes would make a non-safe decision SAFE_TO_AUTOMATE.
    """

    def build_counterfactual_recommendations(
        self,
        object_name: str,
        confidence: float,
        hazard_info: Dict[str, Any],
        decision_info: Dict[str, Any],
        evidence_info: Dict[str, Any]
    ) -> List[str]:

        state = decision_info.get("state")
        recommendations = []

        if state == "SAFE_TO_AUTOMATE":
            return ["Item is already safe for automated bin disposal."]

        if state == "SYSTEM_ERROR":
            return [
                "Install a trained YOLO object detection model file (best.pt / best.onnx)",
                "Ensure camera hardware feed is properly calibrated and connected."
            ]

        if state == "UNKNOWN":
            return [
                "Improve object lighting and reposition waste item clearly in camera view.",
                "Ensure waste is in a transparent or open container so contents are observable.",
                "Perform manual verifier inspection to confirm object classification."
            ]

        if hazard_info.get("is_sharp", False):
            recommendations.extend([
                "Perform physical inspection and confirm sharp item is capped/sheathed.",
                "Verify waste is being deposited into puncture-proof White Sharps Container.",
                "Obtain verifier sign-off for controlled sharps disposal protocol."
            ])

        if evidence_info.get("conflict", False):
            recommendations.extend([
                "Scan correct barcode or RFID tag matching the physical object stream.",
                "Re-weigh item to clear category density mismatch.",
                "Verify department origin waste manifest."
            ])

        if confidence < 0.85 and confidence >= 0.60:
            recommendations.append(
                f"Capture a clearer image or secondary angle to increase confidence from {round(confidence*100, 1)}% above 85%."
            )

        if confidence < 0.60:
            recommendations.append(
                "Provide human verifier manual confirmation for low-confidence object."
            )

        return recommendations or ["Perform manual verifier review before processing."]
