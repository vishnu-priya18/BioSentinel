import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import time
import torch
import numpy as np
import cv2
from pathlib import Path
from PIL import Image
from typing import List, Dict, Any, Optional

class CanonicalYoloWasteDetector:
    """
    Canonical Production YOLO Waste Detector for BioSentinel-X.
    Uses repository-relative pathlib paths. Loads best.pt fine-tuned weights ONCE.
    Never returns fake or mock predictions.
    """

    def __init__(self, confidence_threshold: float = 0.40, iou_threshold: float = 0.45):
        # Resolve repository root dynamically using pathlib
        self.root_dir = Path(__file__).resolve().parents[4]
        self.model_path = self.root_dir / "backend" / "ml" / "models" / "best.pt"
        
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.model = None
        self.model_type = "YOLOv8"
        self.model_status = "NOT_INSTALLED"
        self.classes = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self._load_model()

    def _load_model(self):
        if not self.model_path.exists():
            # Alternative relative fallback path
            alt_path = Path("backend/ml/models/best.pt")
            if alt_path.exists():
                self.model_path = alt_path

        if self.model_path.exists():
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(self.model_path))
                self.classes = getattr(self.model, "names", {})
                self.model_status = "READY"
                print(f"[BioSentinel Vision Model] Path: {self.model_path}")
                print(f"[BioSentinel Vision Model] Status: READY | Classes Count: {len(self.classes)} | Device: {self.device}")
            except Exception as e:
                print(f"[BioSentinel Vision Model] Load Error: {e}")
                self.model_status = "ERROR"
        else:
            self.model_status = "BIOMEDICAL_VISION_MODEL_NOT_INSTALLED"
            print(f"[BioSentinel Vision Model] Path not found: {self.model_path}")

    def is_ready(self) -> bool:
        return self.model is not None and self.model_status == "READY"

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": self.model_status,
            "model_path": str(self.model_path),
            "model_exists": self.model_path.exists(),
            "model_type": self.model_type,
            "classes": list(self.classes.values()) if isinstance(self.classes, dict) else [],
            "class_count": len(self.classes),
            "device": self.device,
            "confidence_threshold": self.confidence_threshold,
            "iou_threshold": self.iou_threshold
        }

    def detect(self, image: Image.Image) -> Dict[str, Any]:
        t0 = time.perf_counter()

        if not self.is_ready():
            return {
                "model_status": self.model_status,
                "inference_ms": round((time.perf_counter() - t0) * 1000, 2),
                "detections": []
            }

        try:
            # Convert PIL image to BGR OpenCV format for robust model handling
            img_rgb = image.convert("RGB")
            img_np = np.array(img_rgb)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            height, width = img_bgr.shape[:2]

            results = self.model(
                img_bgr,
                verbose=False,
                conf=self.confidence_threshold,
                iou=self.iou_threshold
            )
            
            detections = []

            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = self.classes.get(cls_id, f"CLASS_{cls_id}").upper()
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()

                    x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
                    w_box = max(1.0, x2 - x1)
                    h_box = max(1.0, y2 - y1)

                    detections.append({
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(conf, 4),
                        "bbox": {
                            "x1": round(x1, 1),
                            "y1": round(y1, 1),
                            "x2": round(x2, 1),
                            "y2": round(y2, 1),
                            "x": round(x1, 1),
                            "y": round(y1, 1),
                            "width": round(w_box, 1),
                            "height": round(h_box, 1),
                            "img_width": width,
                            "img_height": height
                        }
                    })

            # Sort by confidence descending
            detections.sort(key=lambda d: d["confidence"], reverse=True)
            inference_ms = round((time.perf_counter() - t0) * 1000, 2)

            return {
                "model_status": "READY",
                "inference_ms": inference_ms,
                "image_dimensions": {"width": width, "height": height},
                "detections": detections
            }

        except Exception as e:
            print(f"[BioSentinel Vision Model] Inference Exception: {e}")
            return {
                "model_status": "INFERENCE_ERROR",
                "inference_ms": round((time.perf_counter() - t0) * 1000, 2),
                "detections": []
            }
