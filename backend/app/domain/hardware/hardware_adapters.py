from typing import Dict, Any
from backend.app.config import settings

class HardwareAdapterManager:
    """
    Hardware Interface for Smart Mechanical Bin Chutes, Locks, Weight Sensors & RFID Readers.
    """

    def send_chute_command(self, waste_category: str, decision_state: str) -> Dict[str, Any]:
        if decision_state == "SAFE_TO_AUTOMATE":
            command = f"UNLOCK_{waste_category.upper()}"
        elif decision_state == "HIGH_RISK_ESCALATION":
            command = "LOCK_AND_QUARANTINE"
        else:
            command = "LOCK"

        hardware_connected = not settings.SIMULATE_HARDWARE

        return {
            "command": command,
            "waste_category": waste_category,
            "decision_state": decision_state,
            "hardware_connected": False,
            "display_text": "HARDWARE SIMULATION DISABLED — SOFTWARE DECISION ONLY"
        }
