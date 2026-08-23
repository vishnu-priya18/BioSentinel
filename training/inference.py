import os
import cv2
from PIL import Image
from ultralytics import YOLO

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def run_inference(image_path: str, model_path: str = "models/best.pt"):
    if not os.path.exists(model_path):
        model_path = "backend/ml/models/best.pt"

    model = YOLO(model_path)
    results = model(image_path)
    
    detections = []
    for r in results:
        for box in r.boxes:
            cls_name = model.names[int(box.cls[0].item())]
            conf = float(box.conf[0].item())
            xywh = box.xywh[0].tolist()
            detections.append({
                "class": cls_name,
                "confidence": round(conf, 4),
                "bbox": [round(v, 2) for v in xywh]
            })

    print({"detections": detections})
    return detections

if __name__ == "__main__":
    import sys
    img = sys.argv[1] if len(sys.argv) > 1 else "dataset/images/test/syringe_009.jpg"
    if os.path.exists(img):
        run_inference(img)
