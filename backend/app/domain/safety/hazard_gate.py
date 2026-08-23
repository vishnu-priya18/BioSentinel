from typing import Dict, Any

class HazardGate:
    CRITICAL_SHARPS = {
        "syringe", "needle", "lancet", "scalpel", "blade", "sharp_medical_instrument",
        "broken_glass_medical_item", "sharp_unknown"
    }

    INFECTIOUS_OBJECTS = {
        "blood_stained_gauze", "blood_soaked_gauze", "contaminated_cotton", "dressing",
        "anatomical_waste", "pathological_waste", "infectious_waste", "blood_bag"
    }

    def evaluate_hazard(self, object_name: str) -> Dict[str, Any]:
        object_key = object_name.lower().strip()

        is_sharp = object_key in self.CRITICAL_SHARPS
        is_infectious = object_key in self.INFECTIOUS_OBJECTS

        if is_sharp:
            severity = "CRITICAL"
            automation_allowed = False
        elif is_infectious:
            severity = "HIGH"
            automation_allowed = False
        elif object_key == "unknown_object":
            severity = "HIGH"
            automation_allowed = False
        else:
            severity = "LOW"
            automation_allowed = True

        return {
            "detected": is_sharp or is_infectious or (object_key == "unknown_object"),
            "type": object_name.upper(),
            "severity": severity,
            "is_sharp": is_sharp,
            "is_infectious": is_infectious,
            "automation_allowed": automation_allowed
        }
