from typing import Dict, Any

class WasteStreamMapper:
    """
    Compliance Waste Stream Mapper.
    Maps detected object classes deterministically to biomedical waste streams.
    The AI model identifies WHAT THE OBJECT IS.
    This mapper deterministically assigns the bin color stream.
    The AI is NEVER allowed to invent bin colors directly.
    """

    MAPPINGS = {
        # WHITE STREAM (Sharps & Metal Contaminated)
        "syringe": "WHITE",
        "needle": "WHITE",
        "scalpel": "WHITE",
        "blade": "WHITE",
        "lancet": "WHITE",
        "sharp_medical_instrument": "WHITE",
        "unknown_sharp": "WHITE",

        # YELLOW STREAM (Soiled, Infectious & Anatomical)
        "blood_soaked_gauze": "YELLOW",
        "blood_stained_gauze": "YELLOW",
        "gauze": "YELLOW",
        "cotton": "YELLOW",
        "bandage": "YELLOW",
        "dressing": "YELLOW",
        "anatomical_waste": "YELLOW",
        "pathological_waste": "YELLOW",
        "blood_bag": "YELLOW",
        "specimen_container": "YELLOW",

        # RED STREAM (Contaminated Plastics)
        "iv_set": "RED",
        "iv_tube": "RED",
        "tubing": "RED",
        "contaminated_plastic_tubing": "RED",
        "plastic_container": "RED",
        "catheter": "RED",
        "urine_bag": "RED",
        "gloves": "RED",
        "mask": "RED",

        # BLUE STREAM (Glassware & Medicine Vials)
        "medicine_vial": "BLUE",
        "glass_vial": "BLUE",
        "medicine_bottle_glass": "BLUE",
        "broken_glass": "BLUE",

        # OTHER / GENERAL
        "pharmaceutical_waste": "BLACK",
        "general_medical_waste": "BLACK",

        # UNKNOWN STREAM
        "opaque_bag": "UNKNOWN",
        "unknown_medical_waste": "UNKNOWN",
        "unknown_object": "UNKNOWN"
    }

    STREAM_METADATA = {
        "WHITE": {
            "code": "WHITE",
            "name": "Sharps & Metal Contaminated Waste",
            "bin_color": "WHITE",
            "hex_color": "#F8FAFC",
            "hazard_level": "CRITICAL"
        },
        "RED": {
            "code": "RED",
            "name": "Contaminated Recyclable Plastics",
            "bin_color": "RED",
            "hex_color": "#EF4444",
            "hazard_level": "MODERATE"
        },
        "YELLOW": {
            "code": "YELLOW",
            "name": "Anatomical, Soiled & Bio-Infectious Waste",
            "bin_color": "YELLOW",
            "hex_color": "#EAB308",
            "hazard_level": "HIGH"
        },
        "BLUE": {
            "code": "BLUE",
            "name": "Glassware & Medicine Vials",
            "bin_color": "BLUE",
            "hex_color": "#3B82F6",
            "hazard_level": "HIGH"
        },
        "BLACK": {
            "code": "BLACK",
            "name": "General Non-Biomedical Municipal Waste",
            "bin_color": "BLACK",
            "hex_color": "#1E293B",
            "hazard_level": "LOW"
        },
        "UNKNOWN": {
            "code": "UNKNOWN",
            "name": "Unidentified / Content Not Observable",
            "bin_color": "UNKNOWN",
            "hex_color": "#64748B",
            "hazard_level": "HIGH"
        }
    }

    def map_object_to_stream(self, object_name: str) -> Dict[str, Any]:
        object_key = object_name.lower().strip()
        stream_code = self.MAPPINGS.get(object_key, "UNKNOWN")
        meta = self.STREAM_METADATA.get(stream_code, self.STREAM_METADATA["UNKNOWN"])
        return {
            "stream": meta["code"],
            "category": meta["code"],
            "name": meta["name"],
            "bin_color": meta["bin_color"],
            "hex_color": meta["hex_color"],
            "hazard_level": meta["hazard_level"],
            "reason": f"Object '{object_name}' mapped to regulatory stream {meta['code']}"
        }
