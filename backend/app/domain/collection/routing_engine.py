from typing import Dict, Any

class RoutingEngine:
    """
    Risk-Aware Collection Routing Engine.
    Calculates Task Priority Score P_task based on department criticality, hazard severity, weight & fill level.
    """

    def calculate_priority(
        self,
        department: str,
        waste_category: str,
        weight_kg: float,
        hazard_level: str,
        capacity_percent: float = 50.0,
        hours_pending: float = 1.0
    ) -> Dict[str, Any]:

        # Department weight multiplier
        dept_multipliers = {
            "ICU": 2.5,
            "SURGERY": 2.5,
            "EMERGENCY": 2.0,
            "ONCOLOGY": 2.0,
            "LAB": 1.5,
            "WARD": 1.0
        }
        dept_weight = dept_multipliers.get(department.upper(), 1.0)

        # Hazard risk multiplier
        hazard_multipliers = {
            "CRITICAL": 3.0,
            "HIGH": 2.0,
            "MODERATE": 1.2,
            "LOW": 1.0
        }
        hazard_weight = hazard_multipliers.get(hazard_level.upper(), 1.0)

        # Capacity / Overflow risk
        overflow_factor = (capacity_percent / 100.0) * 30.0

        # Delay factor
        delay_factor = min(30.0, hours_pending * 5.0)

        # Formula for P_task
        raw_score = (dept_weight * 15.0) + (hazard_weight * 20.0) + overflow_factor + delay_factor + (weight_kg * 2.0)
        priority_score = min(100.0, max(10.0, raw_score))

        if priority_score >= 85.0:
            level = "CRITICAL"
            action = "COLLECT IMMEDIATELY"
        elif priority_score >= 65.0:
            level = "HIGH"
            action = "SCHEDULE WITHIN 30 MIN"
        elif priority_score >= 45.0:
            level = "MEDIUM"
            action = "ROUTINE COLLECTION"
        else:
            level = "LOW"
            action = "MONITOR BIN FILL"

        return {
            "priority_score": round(priority_score, 1),
            "priority_level": level,
            "recommended_action": action
        }
