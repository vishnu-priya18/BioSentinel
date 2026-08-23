from PIL import Image
from typing import Dict, Any, List
from backend.app.domain.intelligence.object_detector import YoloWasteDetector
from backend.app.domain.intelligence.waste_category_mapper import WasteCategoryMapper

class ClassifierAdapter:
    def __init__(self):
        self.detector = YoloWasteDetector()
        self.mapper = WasteCategoryMapper()

    def analyze_frame(self, image: Image.Image) -> Dict[str, Any]:
        is_installed = self.detector.is_model_installed()
        detections = self.detector.detect(image)
        
        primary = detections[0] if detections else {
            "class_name": "UNKNOWN_OBJECT",
            "confidence": 0.0,
            "bbox": {"x": 0.0, "y": 0.0, "width": 0.0, "height": 0.0}
        }

        category_info = self.mapper.get_category_for_object(primary["class_name"])

        return {
            "model_installed": is_installed,
            "object": primary,
            "all_detections": detections,
            "category": category_info
        }
