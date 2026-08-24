from PIL import Image
from typing import Dict, Any, List
from backend.app.domain.intelligence.yolo_detector import CanonicalYoloWasteDetector
from backend.app.domain.compliance.waste_category_mapper import DeterministicWasteCategoryMapper

class ClassifierAdapter:
    def __init__(self):
        self.detector = CanonicalYoloWasteDetector()
        self.mapper = DeterministicWasteCategoryMapper()

    def analyze_frame(self, image: Image.Image) -> Dict[str, Any]:
        status_info = self.detector.get_status()
        is_installed = status_info["status"] == "READY"
        
        result = self.detector.detect(image)
        detections = result.get("detections", [])
        inference_ms = result.get("inference_ms", 0.0)

        if detections:
            primary = detections[0]
        else:
            primary = {
                "class_name": "UNKNOWN_OBJECT",
                "confidence": 0.0,
                "bbox": {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0, "x1": 0.0, "y1": 0.0, "x2": 0.0, "y2": 0.0}
            }

        category_info = self.mapper.get_category_for_object(primary["class_name"])

        return {
            "model_installed": is_installed,
            "model_status": status_info["status"],
            "inference_ms": inference_ms,
            "object": primary,
            "all_detections": detections,
            "category": category_info
        }
