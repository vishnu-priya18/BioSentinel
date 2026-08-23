import os
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def export(model_path: str = "backend/ml/models/best.pt", format: str = "onnx"):
    if not os.path.exists(model_path):
        print(f"Model path {model_path} does not exist.")
        return

    model = YOLO(model_path)
    exported_path = model.export(format=format)
    print(f"Model successfully exported to {exported_path}")

if __name__ == "__main__":
    export()
