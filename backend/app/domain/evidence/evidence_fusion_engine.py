from typing import Dict, Any, Optional

class EvidenceFusionEngine:
    def fuse_evidence(
        self,
        vision_category: str,
        vision_confidence: float,
        barcode: Optional[str] = None,
        weight_kg: Optional[float] = None,
        is_opaque_bag: bool = False,
        department: str = "ICU"
    ) -> Dict[str, Any]:

        details = {
            "vision": {"category": vision_category, "confidence": vision_confidence},
            "barcode": barcode,
            "weight_kg": weight_kg,
            "is_opaque_bag": is_opaque_bag,
            "department": department
        }

        if is_opaque_bag:
            return {
                "support": False,
                "conflict": False,
                "missing": True,
                "summary": "Container contents not observable (Opaque Bag)",
                "details": details
            }

        # Check Barcode alignment if provided
        if barcode:
            barcode_upper = barcode.upper()
            # Example barcode rule check: "WHITE-SHARP-01" vs "YELLOW-BIO-01"
            if "YELLOW" in barcode_upper and vision_category != "YELLOW":
                return {
                    "support": False,
                    "conflict": True,
                    "missing": False,
                    "summary": f"CRITICAL CATEGORY CONFLICT: Barcode suggests YELLOW, but Vision detected {vision_category}",
                    "details": details
                }
            if "RED" in barcode_upper and vision_category != "RED":
                return {
                    "support": False,
                    "conflict": True,
                    "missing": False,
                    "summary": f"CRITICAL CATEGORY CONFLICT: Barcode suggests RED, but Vision detected {vision_category}",
                    "details": details
                }
            if "WHITE" in barcode_upper and vision_category != "WHITE":
                return {
                    "support": False,
                    "conflict": True,
                    "missing": False,
                    "summary": f"CRITICAL CATEGORY CONFLICT: Barcode suggests WHITE, but Vision detected {vision_category}",
                    "details": details
                }

        # Check Weight anomalies (e.g. Syringe should be < 1.0 kg, heavy weight > 5 kg suggests anomaly)
        if weight_kg and weight_kg > 5.0 and vision_category in ["WHITE", "BLUE"]:
            return {
                "support": False,
                "conflict": True,
                "missing": False,
                "summary": f"WEIGHT ANOMALY: {weight_kg} kg is unusually high for single {vision_category} item",
                "details": details
            }

        return {
            "support": True,
            "conflict": False,
            "missing": False,
            "summary": f"Multi-source evidence consistent for category {vision_category}",
            "details": details
        }
