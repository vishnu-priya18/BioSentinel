import requests
import json
import base64
import io

BASE_URL = "http://127.0.0.1:8000/api"

def test_live_golden_path():
    print("=================================================================")
    print("      EXECUTING LIVE GOLDEN PATH END-TO-END VERIFICATION")
    print("=================================================================")

    # 1. Health Status Check
    res = requests.get(f"{BASE_URL}/system/health")
    assert res.status_code == 200
    health = res.json()
    print("1. Health Status:", health["status"], "| Cloud:", health["cloud_status"])

    # 2. Syringe Image Data (Draw syringe barrel and needle)
    from PIL import Image as PILImage, ImageDraw
    img = PILImage.new("RGB", (640, 480), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)
    # Draw sharp instrument shape
    draw.rectangle([100, 200, 500, 240], fill=(220, 225, 230), outline=(255, 255, 255))
    draw.rectangle([500, 218, 620, 222], fill=(255, 255, 255), outline=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64_img = base64.b64encode(buf.getvalue()).decode("utf-8")

    # 3. Analyze Waste Image Endpoint (/api/scan)
    print("\n2. Scanning Waste Image...")
    scan_res = requests.post(
        f"{BASE_URL}/scan",
        data={
            "image_base64": b64_img,
            "department": "ICU",
            "weight_kg": "0.35"
        }
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()

    obj = scan_data["object"]
    hazard = scan_data["hazard"]
    decision = scan_data["decision"]

    print(f"   Detected: {obj['class_name'].upper()} | Conf: {round(obj['confidence']*100, 1)}%")
    print(f"   Bounding Box: x={obj['bbox']['x']}, y={obj['bbox']['y']}, w={obj['bbox']['width']}, h={obj['bbox']['height']}")
    print(f"   Hazard: {hazard['severity']} | Category: {scan_data['category']['name']}")
    print(f"   Safety Decision: {decision['state']} | Automation Allowed: {decision['automation_allowed']}")
    print(f"   Reason: {decision['reason']}")

    # Safety Invariant Check: Automation MUST be blocked
    assert decision["automation_allowed"] is False

    # 4. Register Waste & Generate Digital Passport
    print("\n3. Registering Waste Bag & Generating Digital Passport...")
    reg_res = requests.post(
        f"{BASE_URL}/passports",
        json={
            "object_type": obj["class_name"],
            "category_code": scan_data["category"]["code"],
            "department_name": "ICU",
            "weight_kg": 0.35
        }
    )
    assert reg_res.status_code == 200
    passport = reg_res.json()
    waste_id = passport["waste_id"]
    passport_id = passport["passport_id"]
    print(f"   Registered Passport ID: {passport_id} | Waste ID: {waste_id} | Status: {passport['current_status']}")

    # 5. Submit Human Verification if required
    print("\n4. Submitting Human Verification...")
    ver_res = requests.post(
        f"{BASE_URL}/verification",
        params={
            "waste_id": waste_id,
            "action": "APPROVE",
            "verified_category": scan_data["category"]["code"],
            "notes": "Approved by sharp supervisor"
        }
    )
    assert ver_res.status_code == 200
    ver_data = ver_res.json()
    print(f"   Verification Status: {ver_data['message']}")

    # Get updated passport status
    p_check = requests.get(f"{BASE_URL}/passports/{passport_id}")
    assert p_check.status_code == 200
    print(f"   Verified Passport Lifecycle Status: {p_check.json()['current_status']}")

    # 6. Complete Collection Task
    print("\n5. Completing Collection Task...")
    task_id = f"TASK-{waste_id}"
    col_res = requests.post(f"{BASE_URL}/collection/{task_id}/confirm")
    assert col_res.status_code == 200
    print(f"   Collection Status: {col_res.json()['message']}")

    # 7. Verify SHA-256 Audit Chain
    print("\n6. Verifying SHA-256 Cryptographic Audit Chain...")
    audit_res = requests.post(f"{BASE_URL}/audit/verify")
    assert audit_res.status_code == 200
    audit_v = audit_res.json()
    clean_msg = audit_v['message'].encode('ascii', 'ignore').decode()
    print(f"   Result: {clean_msg} (Total Blocks: {audit_v['total_blocks']})")

    assert audit_v["is_valid"] is True
    print("\n================================================")
    print("SUCCESS: ALL E2E GOLDEN PATH STEPS COMPLETED SUCCESSFULLY!")
    print("================================================\n")

if __name__ == "__main__":
    test_live_golden_path()
