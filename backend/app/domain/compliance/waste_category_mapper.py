import json
import os
from typing import Dict, Any, List

class DeterministicWasteCategoryMapper:
    """
    Deterministic Waste Stream Mapper.
    Kept strictly separate from AI Perception!
    The AI model identifies WHAT THE OBJECT IS.
    This mapper deterministically assigns the biomedical waste category bin.
    The AI is never allowed to invent bin colors.
    """

    MAPPINGS = {
        # WHITE STREAM (Sharps & Metals)
        "syringe": "WHITE",
        "needle": "WHITE",
        "lancet": "WHITE",
        "scalpel": "WHITE",
        "blade": "WHITE",
        "sharp_medical_instrument": "WHITE",
        "SHARP_UNKNOWN": "WHITE",

        # YELLOW STREAM (Soiled, Infectious & Anatomical)
        "blood_stained_gauze": "YELLOW",
        "blood_soaked_gauze": "YELLOW",
        "contaminated_cotton": "YELLOW",
        "dressing": "YELLOW",
        "anatomical_waste": "YELLOW",
        "pathological_waste": "YELLOW",
        "infectious_waste": "YELLOW",
        "blood_bag": "YELLOW",

        # RED STREAM (Contaminated Plastics)
        "iv_tube": "RED",
        "iv_set": "RED",
        "contaminated_plastic_tubing": "RED",
        "catheter": "RED",
        "urine_bag": "RED",
        "plastic_medical_item": "RED",
        "disposable_plastic_medical_item": "RED",
        "glove": "RED",
        "mask": "RED",
        "plastic_medical_container": "RED",

        # BLUE STREAM (Glassware & Medicine Vials)
        "glass_vial": "BLUE",
        "medicine_bottle_glass": "BLUE",
        "broken_glass_medical_item": "BLUE",
        "glass_ampoule": "BLUE",
        "vial": "BLUE",

        # BLACK STREAM (General Municipal)
        "medicine_packaging": "BLACK",
        "general_medical_waste": "BLACK",
        "general_non_biomedical_waste": "BLACK",

        # UNKNOWN STREAM
        "unknown_object": "UNKNOWN"
    }

    CATEGORY_METADATA = {
        "WHITE": {
            "code": "WHITE",
            "name": "Sharps & Metal Contaminated Waste",
            "bin_color": "WHITE",
            "hex_color": "#F8FAFC",
            "text_color": "#0F172A",
            "border_color": "#CBD5E1",
            "hazard_level": "CRITICAL",
            "autoclave_required": True,
            "incineration_required": False
        },
        "RED": {
            "code": "RED",
            "name": "Contaminated Recyclable Plastics",
            "bin_color": "RED",
            "hex_color": "#EF4444",
            "text_color": "#FFFFFF",
            "border_color": "#B91C1C",
            "hazard_level": "MODERATE",
            "autoclave_required": True,
            "incineration_required": False
        },
        "YELLOW": {
            "code": "YELLOW",
            "name": "Anatomical, Soiled & Bio-Infectious Waste",
            "bin_color": "YELLOW",
            "hex_color": "#EAB308",
            "text_color": "#0F172A",
            "border_color": "#CA8A04",
            "hazard_level": "HIGH",
            "autoclave_required": False,
            "incineration_required": True
        },
        "BLUE": {
            "code": "BLUE",
            "name": "Glassware & Cytotoxic Medicine Vials",
            "bin_color": "BLUE",
            "hex_color": "#3B82F6",
            "text_color": "#FFFFFF",
            "border_color": "#1D4ED8",
            "hazard_level": "HIGH",
            "autoclave_required": True,
            "incineration_required": False
        },
        "BLACK": {
            "code": "BLACK",
            "name": "General Non-Biomedical Municipal Waste",
            "bin_color": "BLACK",
            "hex_color": "#1E293B",
            "text_color": "#FFFFFF",
            "border_color": "#0F172A",
            "hazard_level": "LOW",
            "autoclave_required": False,
            "incineration_required": False
        },
        "UNKNOWN": {
            "code": "UNKNOWN",
            "name": "Unidentified / Content Not Observable",
            "bin_color": "UNKNOWN",
            "hex_color": "#64748B",
            "text_color": "#FFFFFF",
            "border_color": "#475569",
            "hazard_level": "HIGH",
            "autoclave_required": False,
            "incineration_required": False
        }
    }

    def get_category_for_object(self, object_name: str) -> Dict[str, Any]:
        object_key = object_name.lower().strip()
        category_code = self.MAPPINGS.get(object_key, "UNKNOWN")
        return self.CATEGORY_METADATA.get(category_code, self.CATEGORY_METADATA["UNKNOWN"])
