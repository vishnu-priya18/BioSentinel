import os
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def export_onnx(model_path: str = "models/best.pt"):
    if not os.path.exists(model_path):
        model_path = "backend/ml/models/best.pt"

    model = YOLO(model_path)
    path = model.export(format="onnx")
    print(f"[BioSentinel-X ML] Exported ONNX model to {path}")

if __name__ == "__main__":
    export_onnx()
