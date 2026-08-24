import requests
import json
import base64
import io

BASE_URL = "http://127.0.0.1:8000/api"

def test_live_golden_path():
    print("=================================================================")
    print("      EXECUTING LIVE GOLDEN PATH END-TO-END VERIFICATION")
    print("=================================================================")

    # 1. System Health Check
    res = requests.get(f"{BASE_URL}/system/health")
    assert res.status_code == 200
    health = res.json()
    print("1. Health Status:", health["status"], "| Cloud:", health["cloud_status"])

    # 2. Syringe Image Data (Draw syringe barrel and needle)
    from PIL import Image as PILImage, ImageDraw
    img = PILImage.new("RGB", (640, 480), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)
    # Draw syringe barrel (elongated aspect ratio > 3.0)
    draw.rectangle([100, 200, 500, 240], fill=(220, 225, 230), outline=(255, 255, 255))
    # Draw needle tip with metallic specular white highlight (>230 intensity)
    draw.rectangle([500, 218, 620, 222], fill=(255, 255, 255), outline=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64_img = base64.b64encode(buf.getvalue()).decode("utf-8")

    # 3. Analyze Waste Image Endpoint (/api/scan or /api/waste-events/analyze)
    print("\n2. Scanning Syringe Image...")
    scan_res = requests.post(f"{BASE_URL}/scan", data={"image_base64": b64_img, "department": "ICU", "weight_kg": 0.3})
    if scan_res.status_code != 200:
        print("Scan failed with code:", scan_res.status_code, scan_res.text)
    assert scan_res.status_code == 200
    data = scan_res.json()
    
    obj_name = data["object"]["class_name"]
    conf = data["object"]["confidence"]
    bbox = data["object"]["bbox"]
    decision = data["decision"]
    hazard = data["hazard"]

    print(f"   Detected: {obj_name.upper()} | Conf: {round(conf*100, 1)}%")
    print(f"   Bounding Box: x={bbox['x']}, y={bbox['y']}, w={bbox['width']}, h={bbox['height']}")
    print(f"   Hazard: {hazard['severity']} | Category: {data['category']['code']} BIN")
    print(f"   Safety Decision: {decision['state']} | Automation Allowed: {decision['automation_allowed']}")
    print(f"   Reason: {decision['reason']}")

    assert hazard["is_sharp"] is True
    assert decision["automation_allowed"] is False
    assert decision["decision_code"] == "HUMAN_VERIFICATION_REQUIRED"

    # 4. Register Waste Item & Generate Passport
    print("\n3. Registering Waste Bag & Generating Digital Passport...")
    reg_res = requests.post(f"{BASE_URL}/passports", json={
        "object_type": obj_name,
        "category_code": data["category"]["code"],
        "department_name": "ICU",
        "weight_kg": 0.3
    })
    assert reg_res.status_code == 200
    passport = reg_res.json()
    waste_id = passport["waste_id"]
    passport_id = passport["passport_id"]
    print(f"   Registered Passport ID: {passport_id} | Waste ID: {waste_id} | Status: {passport['current_status']}")

    # 5. Human Verification
    print("\n4. Submitting Human Verification...")
    verif_res = requests.post(f"{BASE_URL}/verification", params={
        "waste_id": waste_id,
        "action": "APPROVE",
        "verified_category": "WHITE",
        "notes": "Approved by sharp supervisor"
    })
    assert verif_res.status_code == 200
    print("   Verification Status:", verif_res.json()["message"])

    # 6. Retrieve Updated Passport
    p_get = requests.get(f"{BASE_URL}/passports/{passport_id}")
    assert p_get.status_code == 200
    print("   Verified Passport Lifecycle Status:", p_get.json()["current_status"])

    # 7. Collection Queue & Confirm Completion
    print("\n5. Completing Collection Task...")
    tasks_res = requests.get(f"{BASE_URL}/collection/tasks")
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    target_task = [t for t in tasks if t["waste_id"] == waste_id][0]
    
    comp_res = requests.post(f"{BASE_URL}/collection/{target_task['task_id']}/confirm")
    assert comp_res.status_code == 200
    print("   Collection Status:", comp_res.json()["message"])

    # 8. Cryptographic Audit Chain Recomputation
    print("\n6. Verifying SHA-256 Cryptographic Audit Chain...")
    audit_res = requests.post(f"{BASE_URL}/audit/verify")
    assert audit_res.status_code == 200
    audit_v = audit_res.json()
    print(f"   Result: {audit_v['message'].encode('ascii', 'ignore').decode()} (Total Blocks: {audit_v['total_blocks']})")

    assert audit_v["is_valid"] is True
    print("\n================================================")
    print("SUCCESS: ALL E2E GOLDEN PATH STEPS COMPLETED SUCCESSFULLY!")
    print("================================================\n")

if __name__ == "__main__":
    test_live_golden_path()
