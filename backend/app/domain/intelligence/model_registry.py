import os
from typing import Dict, Any, List
from backend.app.config import settings

class ModelRegistry:
    def __init__(self):
        self.model_dir = settings.ML_MODEL_DIR
        self.model_filename = settings.ML_MODEL_FILE

    def get_active_model_info(self) -> Dict[str, Any]:
        full_path = os.path.join(self.model_dir, self.model_filename)
        installed = os.path.exists(full_path)
        
        return {
            "installed": installed,
            "filename": self.model_filename,
            "full_path": full_path,
            "architecture": "YOLOv8 Object Detector",
            "framework": "Ultralytics PyTorch / ONNX Runtime",
            "vocabulary_size": 28,
            "status": "READY" if installed else "BIOMEDICAL VISION MODEL NOT INSTALLED"
        }

    def list_available_models(self) -> List[str]:
        if not os.path.exists(self.model_dir):
            return []
        return [f for f in os.listdir(self.model_dir) if f.endswith(('.pt', '.onnx', '.engine'))]
