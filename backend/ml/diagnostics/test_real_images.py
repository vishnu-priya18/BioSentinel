import sys
import os
from pathlib import Path

# Add repository root to python path
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import time
import cv2
from PIL import Image
from backend.app.domain.intelligence.yolo_detector import CanonicalYoloWasteDetector

def run_vision_diagnostics(test_folder: str = "backend/ml/datasets/images/val", output_folder: str = "runs/vision_diagnostics"):
    print("=================================================================")
    print("      BIOSENTINEL-X REAL VISION DIAGNOSTICS SUITE")
    print("=================================================================")

    detector = CanonicalYoloWasteDetector()
    status_info = detector.get_status()

    print(f"Model Status: {status_info['status']}")
    print(f"Model Path: {status_info['model_path']}")
    print(f"Device: {status_info['device']}")
    print(f"Loaded Classes Count: {status_info['class_count']}")

    if not detector.is_ready():
        print("ERROR: Vision model is not ready. Aborting diagnostic run.")
        return

    test_path = Path(test_folder)
    if not test_path.exists():
        print(f"Warning: Test path {test_folder} does not exist. Searching for image files in backend/ml/...")
        test_path = Path("backend/ml/datasets/images/train")

    if not test_path.exists():
        print(f"No image folder found at {test_folder}. Creating diagnostic summary.")
        return

    image_files = list(test_path.glob("*.jpg")) + list(test_path.glob("*.png")) + list(test_path.glob("*.jpeg"))
    print(f"\nProcessing {len(image_files)} test images from: {test_path}")

    out_path = Path(output_folder)
    out_path.mkdir(parents=True, exist_ok=True)

    total_images = len(image_files)
    images_with_detections = 0
    total_detections_count = 0
    confidences = []
    inference_times = []
    class_distribution = {}
    images_no_detection = []

    for img_file in image_files:
        try:
            pil_img = Image.open(img_file).convert("RGB")
            res = detector.detect(pil_img)
            
            inf_ms = res.get("inference_ms", 0.0)
            inference_times.append(inf_ms)

            dets = res.get("detections", [])
            if dets:
                images_with_detections += 1
                total_detections_count += len(dets)
                
                # Annotate image
                cv_img = cv2.imread(str(img_file))
                for d in dets:
                    c_name = d["class_name"]
                    conf = d["confidence"]
                    confidences.append(conf)
                    class_distribution[c_name] = class_distribution.get(c_name, 0) + 1

                    bbox = d["bbox"]
                    x1, y1, x2, y2 = int(bbox["x1"]), int(bbox["y1"]), int(bbox["x2"]), int(bbox["y2"])
                    cv2.rectangle(cv_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(cv_img, f"{c_name} {int(conf*100)}%", (x1, max(20, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                annotated_save_path = out_path / img_file.name
                cv2.imwrite(str(annotated_save_path), cv_img)
            else:
                images_no_detection.append(img_file.name)

        except Exception as e:
            print(f"Error evaluating {img_file.name}: {e}")

    avg_conf = (sum(confidences) / len(confidences)) if confidences else 0.0
    avg_inf_ms = (sum(inference_times) / len(inference_times)) if inference_times else 0.0

    print("\n-----------------------------------------------------------------")
    print("                      DIAGNOSTIC RESULTS")
    print("-----------------------------------------------------------------")
    print(f"Total Test Images:            {total_images}")
    print(f"Images with Detections:       {images_with_detections} ({(images_with_detections/max(1, total_images))*100:.1f}%)")
    print(f"Total Object Detections:      {total_detections_count}")
    print(f"Average Model Confidence:     {avg_conf*100:.1f}%")
    print(f"Average Inference Speed:      {avg_inf_ms:.2f} ms")
    print(f"Class Distribution Breakdown: {class_distribution}")
    print(f"Images with No Detections:    {len(images_no_detection)}")
    print(f"Annotated Images Saved To:    {out_path}")
    print("=================================================================\n")

if __name__ == "__main__":
    run_vision_diagnostics()
