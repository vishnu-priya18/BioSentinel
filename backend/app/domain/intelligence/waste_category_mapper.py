import json
import os
from typing import Dict, Any
from backend.app.config import settings

class WasteCategoryMapper:
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(
                settings.BASE_DIR, "backend", "app", "config", "waste_categories.json"
            )
        self.config_path = config_path
        self.categories = {}
        self.object_to_category = {}
        self._load_config()

    def _load_config(self):
        try:
            with open(self.config_path, "r") as f:
                data = json.load(f)
                self.categories = data.get("categories", {})
                self.object_to_category = data.get("object_to_category", {})
        except Exception as e:
            print(f"[WasteCategoryMapper] Failed to load config: {e}")
            self.categories = {}
            self.object_to_category = {}

    def get_category_for_object(self, object_name: str) -> Dict[str, Any]:
        object_name = object_name.upper()
        category_code = self.object_to_category.get(object_name, "UNKNOWN")
        cat_info = self.categories.get(category_code, self.categories.get("UNKNOWN", {
            "code": "UNKNOWN",
            "name": "Unidentified / Content Not Observable",
            "bin_color": "UNKNOWN",
            "hex_color": "#64748B",
            "text_color": "#FFFFFF",
            "border_color": "#475569",
            "hazard_level": "HIGH",
            "autoclave_required": False,
            "incineration_required": False
        }))
        return cat_info
