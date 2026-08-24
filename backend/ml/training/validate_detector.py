import os
from pathlib import Path
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def validate(model_path: str = None):
    root_dir = Path(__file__).resolve().parents[3]
    if model_path is None:
        target_path = root_dir / "backend" / "ml" / "models" / "best.pt"
    else:
        target_path = Path(model_path)

    data_yaml = root_dir / "backend" / "ml" / "datasets" / "data.yaml"

    if not target_path.exists():
        print(f"[BioSentinel ML] Model path {target_path} does not exist.")
        return

    print(f"[BioSentinel ML] Validating model: {target_path}")
    model = YOLO(str(target_path))
    metrics = model.val(data=str(data_yaml))
    
    print(f"[BioSentinel ML] mAP50-95: {metrics.box.map:.4f}")
    print(f"[BioSentinel ML] mAP50:    {metrics.box.map50:.4f}")
    print(f"[BioSentinel ML] Precision: {metrics.box.mp:.4f}")
    print(f"[BioSentinel ML] Recall:    {metrics.box.mr:.4f}")

if __name__ == "__main__":
    validate()
