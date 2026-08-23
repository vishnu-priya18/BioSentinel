import os
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def validate_model(model_path: str = "models/best.pt"):
    if not os.path.exists(model_path):
        model_path = "backend/ml/models/best.pt"

    print(f"[BioSentinel-X ML] Validating model from {model_path}...")
    model = YOLO(model_path)
    metrics = model.val(data="dataset.yaml")
    
    print(f"mAP50: {metrics.box.map50}")
    print(f"mAP50-95: {metrics.box.map}")

if __name__ == "__main__":
    validate_model()
