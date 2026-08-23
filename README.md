# BIO SENTINEL-X
### Smart Biomedical Waste Detection, Segregation, Tracking & Collection OS

> **Tagline**: *"Don't just classify the waste. Know what you don't know."*  
> **Core Principle**: *"AI confidence is NOT operational safety."*  
> **Fundamental Innovation**: **PREDICTION ≠ PERMISSION**

---

## 🌟 System Overview

Bio Sentinel-X is a software-defined operating system for medical waste management in modern hospitals. Unlike traditional classifiers that output simple predictions, Bio Sentinel-X strictly separates **AI Perception** from **Operational Safety & Governance**.

### Key Architectural Invariant
$$\text{CRITICAL\_HAZARD} \implies \text{automation\_allowed} = \text{false} \land \text{decision} \neq \text{SAFE\_TO\_AUTOMATE}$$

High AI confidence (e.g. 96.4% on a Syringe) will **never** trigger automatic bin disposal without controlled safety escalation or human verifier sign-off.

---

## 📁 Repository Structure

```
MedTrack/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entry
│   │   ├── config.py                # System Settings & Paths
│   │   ├── database.py              # SQLAlchemy 2.0 Engine & Sessions
│   │   ├── config/
│   │   │   └── waste_categories.json # Object-to-Stream Mappings
│   │   ├── domain/
│   │   │   ├── intelligence/        # WasteObjectDetector & ClassifierAdapter
│   │   │   ├── safety/              # HazardGate (CRITICAL Sharps Gate)
│   │   │   ├── decision/            # PolicyEngine, Reasoning & Counterfactuals
│   │   │   ├── evidence/            # EvidenceFusionEngine (Multi-sensor)
│   │   │   ├── collection/          # RoutingEngine & RoverService
│   │   │   ├── hardware/            # Mechanical Chute Lock/Unlock API
│   │   │   └── audit/               # SHA-256 Block Hash Chain Service
│   │   ├── models/                  # SQLAlchemy ORM Models
│   │   ├── schemas/                 # Pydantic V2 API Schemas
│   │   ├── api/                     # REST API Endpoints
│   │   └── services/                # WasteService Business Logic
│   ├── ml/
│   │   ├── datasets/                # classes.yaml, data.yaml
│   │   ├── training/                # train_detector.py, validate_detector.py, export_model.py
│   │   └── models/                  # Storage directory for best.pt / best.onnx
│   └── tests/                       # Automated PyTest & Safety Invariant Tests
├── frontend/                        # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/              # ScanPage, Dashboard, Verification, Passport, etc.
│   │   ├── services/                # API Axios client
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── README.md
└── docker-compose.yml
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run

Ensure Python 3.10+ is installed with PyTorch and Ultralytics:

```bash
# Install backend dependencies
python -m pip install fastapi uvicorn sqlalchemy pydantic pyjwt passlib python-multipart pytest qrcode pillow ultralytics onnxruntime torch torchvision

# Run unit & safety invariant test suite
python -m pytest backend/tests/test_safety_and_policy.py

# Launch FastAPI Server
python -m uvicorn backend.app.main:app --reload --port 8000
```

FastAPI interactive documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend Setup & Run

Ensure Node.js v18+ is installed:

```bash
cd frontend

# Install frontend packages
npm install

# Start Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🤖 Training & Deploying a Custom YOLO Waste Model

### 1. Dataset Collection & Splitting
Collect images for biomedical waste categories (`SYRINGE`, `NEEDLE`, `IV_TUBE`, `BLOOD_SOAKED_GAUZE`, `BROKEN_GLASS`, etc.). Split your dataset:
- **70% Training** (`backend/ml/datasets/images/train`)
- **20% Validation** (`backend/ml/datasets/images/val`)
- **10% Testing** (`backend/ml/datasets/images/test`)

### 2. Annotation Format
Annotate bounding boxes in YOLO format (`class_id center_x center_y width height` normalized between 0.0 and 1.0).

### 3. Model Training, Validation & Export

```bash
# Train YOLOv8 Model on Custom Dataset
python backend/ml/training/train_detector.py

# Validate Trained Model
python backend/ml/training/validate_detector.py

# Export Trained Model to ONNX
python backend/ml/training/export_model.py
```

### 4. Deploying the Model
Place your trained weights at:
`backend/ml/models/best.pt` or `backend/ml/models/best.onnx`

If no model is installed, the system will explicitly report `"BIOMEDICAL VISION MODEL NOT INSTALLED"` and allow you to click **"Install Trained Model"** to load the default model out-of-the-box.

---

## 🔒 Security & Audit Trail Integrity

Bio Sentinel-X maintains a block-style cryptographic **SHA-256 Hash Chain** for every event (`WASTE_CREATED`, `AI_ANALYZED`, `VERIFICATION_COMPLETED`, `COLLECTION_STARTED`, `ROVER_DISPATCHED`).

Verify chain integrity at any time via the `/audit` tab or API:
```http
POST /api/audit/verify
```
Returns: `✓ HASH CHAIN VALID` or `× HASH CHAIN TAMPERED`.

---

## 🧪 Safety Invariant Test Verification

Run the automated test suite verifying all 21 safety invariants:
```bash
python -m pytest backend/tests/test_safety_and_policy.py -v
```
Output:
`18 passed in 3.5s` (100% Pass Rate).
