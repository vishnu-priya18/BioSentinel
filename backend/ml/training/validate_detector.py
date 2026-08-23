import os
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def validate(model_path: str = "backend/ml/models/best.pt"):
    if not os.path.exists(model_path):
        print(f"Model path {model_path} does not exist.")
        return

    model = YOLO(model_path)
    metrics = model.val(data="backend/ml/datasets/data.yaml")
    print(f"mAP50-95: {metrics.box.map}")
    print(f"mAP50: {metrics.box.map50}")

if __name__ == "__main__":
    validate()
