import os
import sys
import webbrowser
import time

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

print("=======================================================================")
print("              BIO SENTINEL-X APPLICATION LAUNCHER")
print("Smart Biomedical Waste Detection, Segregation, Tracking & Collection OS")
print("=======================================================================")
print("\nStarting Unified Application Server & Integrated AI Perception Pipeline...")
print("AI Model Path: backend/ml/models/best.pt")
print("Opening Browser to: http://127.0.0.1:8000/\n")

def open_url():
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:8000/")

import threading
threading.Thread(target=open_url, daemon=True).start()

import uvicorn
uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)
