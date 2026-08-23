import datetime
from typing import Dict, Any

class RoverService:
    """
    Software interface for MedWaste Autonomous Mobile Robot (AMR).
    Works cleanly in software mode when physical rover is offline.
    """

    def dispatch_rover(
        self,
        task_id: str,
        pickup_location: str,
        waste_category: str,
        waste_weight: float,
        priority: str = "HIGH",
        hazard_level: str = "CRITICAL"
    ) -> Dict[str, Any]:

        return {
            "rover_id": "MED-ROVER-01",
            "task_id": task_id,
            "pickup_location": pickup_location,
            "waste_category": waste_category,
            "waste_weight": waste_weight,
            "priority": priority,
            "hazard_level": hazard_level,
            "status": "DISPATCHED",
            "battery_percent": 92.5,
            "hardware_connected": False,
            "message": "Rover task dispatched to software interface (ROVER OFFLINE)",
            "dispatched_at": datetime.datetime.utcnow().isoformat()
        }

    def get_rover_status(self, rover_id: str = "MED-ROVER-01") -> Dict[str, Any]:
        return {
            "rover_id": rover_id,
            "status": "IDLE",
            "current_location": "Central Storage Dock B",
            "battery_percent": 92.5,
            "hardware_connected": False,
            "status_text": "ROVER OFFLINE - Software Simulation Ready"
        }
