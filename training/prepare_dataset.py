import os
import cv2
import numpy as np

CLASSES = [
    "syringe", "needle", "lancet", "scalpel", "blade", "sharp_medical_instrument",
    "blood_stained_gauze", "contaminated_cotton", "dressing", "anatomical_waste", "pathological_waste",
    "iv_tube", "contaminated_plastic_tubing", "plastic_medical_item", "catheter", "urine_bag", "disposable_plastic_medical_item",
    "glass_vial", "medicine_bottle_glass", "broken_glass_medical_item", "glass_ampoule",
    "medicine_packaging", "general_medical_waste"
]

def prepare_dataset(base_dir: str = "dataset"):
    """
    Creates dataset directory structure (train/val/test splits: 70% / 20% / 10%)
    and populates initial annotated dataset for training.
    """
    splits = ["train", "val", "test"]
    for split in splits:
        os.makedirs(os.path.join(base_dir, "images", split), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "labels", split), exist_ok=True)

    img_size = 640
    print(f"[BioSentinel-X ML] Preparing dataset splits (70% train / 20% val / 10% test)...")

    for cls_idx, cls_name in enumerate(CLASSES):
        # 10 samples per class across train/val/test
        for i in range(10):
            img = np.zeros((img_size, img_size, 3), dtype=np.uint8)
            # Simulated hospital surface noise
            noise = np.random.randint(190, 230, (img_size, img_size, 3), dtype=np.uint8)
            img = cv2.addWeighted(img, 0.2, noise, 0.8, 0)

            w = np.random.randint(80, 220)
            h = np.random.randint(80, 320)
            cx = np.random.randint(150, img_size - 150)
            cy = np.random.randint(150, img_size - 150)

            x1, y1 = max(0, cx - w // 2), max(0, cy - h // 2)
            x2, y2 = min(img_size, cx + w // 2), min(img_size, cy + h // 2)

            # Draw representative shapes
            if cls_name in ["syringe", "needle", "scalpel", "blade", "lancet", "sharp_medical_instrument"]:
                cv2.rectangle(img, (x1, y1), (x2, y2), (230, 230, 230), -1)
                cv2.line(img, (cx, y1), (cx, y1 - 30), (120, 120, 120), 4)
            elif "blood" in cls_name or "anatomical" in cls_name:
                cv2.ellipse(img, (cx, cy), (w//2, h//2), 0, 0, 360, (20, 20, 190), -1)
            elif "glass" in cls_name or "vial" in cls_name:
                cv2.rectangle(img, (x1, y1), (x2, y2), (220, 245, 255), -1)
                cv2.rectangle(img, (x1, y1), (x2, y2), (60, 60, 60), 2)
            else:
                cv2.rectangle(img, (x1, y1), (x2, y2), (180, 100, 100), -1)

            # Determine split: 70% train, 20% val, 10% test
            if i < 7:
                target_split = "train"
            elif i < 9:
                target_split = "val"
            else:
                target_split = "test"

            img_path = os.path.join(base_dir, "images", target_split, f"{cls_name}_{i:03d}.jpg")
            lbl_path = os.path.join(base_dir, "labels", target_split, f"{cls_name}_{i:03d}.txt")

            cv2.imwrite(img_path, img)

            norm_cx = cx / img_size
            norm_cy = cy / img_size
            norm_w = (x2 - x1) / img_size
            norm_h = (y2 - y1) / img_size

            with open(lbl_path, "w") as f:
                f.write(f"{cls_idx} {norm_cx:.6f} {norm_cy:.6f} {norm_w:.6f} {norm_h:.6f}\n")

    print("[BioSentinel-X ML] Dataset preparation complete.")

if __name__ == "__main__":
    prepare_dataset()
