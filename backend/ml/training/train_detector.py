import os
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def train():
    data_yaml = os.path.join("backend", "ml", "datasets", "data.yaml")
    output_dir = os.path.join("backend", "ml", "models")
    
    print("[BIO SENTINEL-X] Starting Biomedical Waste YOLOv8 Detector Training...")
    model = YOLO("yolov8n.pt")  # Initialize with pre-trained weights
    
    model.train(
        data=data_yaml,
        epochs=50,
        imgsz=640,
        batch=16,
        project=output_dir,
        name="biomed_waste_yolo",
        exist_ok=True
    )
    print(f"[BIO SENTINEL-X] Training Complete. Model saved to {output_dir}/biomed_waste_yolo/weights/best.pt")

if __name__ == "__main__":
    train()
