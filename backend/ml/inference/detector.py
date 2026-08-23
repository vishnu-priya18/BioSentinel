import os
import cv2
import torch
import numpy as np
from PIL import Image
from typing import List, Dict, Any

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class BiomedicalWasteDetector:
    """
    Real Trained YOLO Inference Engine for BioSentinel-X.
    Loads best.pt / best.onnx model and performs actual object detection.
    Never returns fake or randomized predictions.
    """

    VOCABULARY = [
        "syringe", "needle", "scalpel", "blade", "lancet", "iv_set", "iv_tube",
        "blood_bag", "blood_soaked_gauze", "gauze", "cotton", "bandage", "dressing",
        "gloves", "mask", "medicine_vial", "glass_vial", "broken_glass",
        "plastic_container", "urine_bag", "catheter", "tubing", "specimen_container",
        "pharmaceutical_waste", "anatomical_waste", "opaque_bag", "unknown_sharp",
        "unknown_medical_waste"
    ]

    def __init__(self, model_path: str = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            model_path = os.path.join(base_dir, "backend", "ml", "models", "best.pt")

        self.model_path = model_path
        self.model = None
        self.model_status = "NOT_AVAILABLE"

        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.model_path)
                self.model_status = "READY"
                print(f"[BioSentinel-X ML] Loaded Trained YOLO model from {self.model_path}")
            except Exception as e:
                print(f"[BioSentinel-X ML] Model load error: {e}")
                self.model_status = "ERROR"
        else:
            # Fallback check
            alt_path = os.path.join("models", "best.pt")
            if os.path.exists(alt_path):
                try:
                    from ultralytics import YOLO
                    self.model = YOLO(alt_path)
                    self.model_status = "READY"
                    print(f"[BioSentinel-X ML] Loaded Trained YOLO model from {alt_path}")
                except Exception as e:
                    self.model_status = "ERROR"

    def is_ready(self) -> bool:
        return self.model is not None and self.model_status == "READY"

    def detect(self, image: Image.Image) -> List[Dict[str, Any]]:
        if not self.is_ready():
            return []

        # Convert PIL Image to OpenCV numpy format
        img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        height, width = img_np.shape[:2]

        results = self.model(img_np, verbose=False)
        detections = []

        for r in results:
            for box in r.boxes:
                cls_idx = int(box.cls[0].item())
                cls_name = self.model.names.get(cls_idx, "unknown_medical_waste") if hasattr(self.model, "names") else "unknown_medical_waste"
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()

                x1, y1, x2, y2 = xyxy[0], xyxy[1], xyxy[2], xyxy[3]

                detections.append({
                    "class_name": cls_name.lower(),
                    "confidence": round(conf, 4),
                    "bbox": {
                        "x1": round(x1, 1),
                        "y1": round(y1, 1),
                        "x2": round(x2, 1),
                        "y2": round(y2, 1),
                        "x": round(x1, 1),
                        "y": round(y1, 1),
                        "width": round(x2 - x1, 1),
                        "height": round(y2 - y1, 1)
                    }
                })

        # Sort detections by confidence descending
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections
