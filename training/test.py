import os
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def test_model(model_path: str = "models/best.pt"):
    if not os.path.exists(model_path):
        model_path = "backend/ml/models/best.pt"

    print(f"[BioSentinel-X ML] Evaluating model on test dataset split...")
    model = YOLO(model_path)
    metrics = model.val(data="dataset.yaml", split="test")
    print(f"Test Set mAP50: {metrics.box.map50}")

if __name__ == "__main__":
    test_model()
