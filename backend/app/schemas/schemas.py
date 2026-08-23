import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# Bounding Box Schema
class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

# Single Object Detection Schema
class ObjectDetectionResult(BaseModel):
    class_name: str
    confidence: float
    bbox: BoundingBox

# Image Analysis Request
class AnalyzeImageRequest(BaseModel):
    image_base64: str
    barcode: Optional[str] = None
    weight_kg: Optional[float] = None
    department: Optional[str] = "ICU"
    rfid_tag: Optional[str] = None
    is_opaque_bag: Optional[bool] = False

# Category Info Schema
class CategoryInfo(BaseModel):
    code: str
    name: str
    bin_color: str
    hex_color: str
    hazard_level: str
    autoclave_required: bool
    incineration_required: bool

# Hazard Assessment Schema
class HazardAssessmentResult(BaseModel):
    detected: bool
    type: str
    severity: str  # CRITICAL, HIGH, MODERATE, LOW
    is_sharp: bool
    is_infectious: bool
    automation_allowed: bool

# Decision State Result
class DecisionResult(BaseModel):
    state: str  # SAFE_TO_AUTOMATE, NEEDS_VERIFICATION, HIGH_RISK_ESCALATION, UNKNOWN, SYSTEM_ERROR
    automation_allowed: bool
    reason: str
    why_checklist: List[Dict[str, Any]]
    what_safe_checklist: List[str]

# Evidence Fusion Result
class EvidenceFusionResult(BaseModel):
    support: bool
    conflict: bool
    missing: bool
    summary: str
    details: Dict[str, Any]

# Complete Detection & Analysis Endpoint Response
class WasteAnalysisResponse(BaseModel):
    model_installed: bool
    object: ObjectDetectionResult
    category: CategoryInfo
    hazard: HazardAssessmentResult
    decision: DecisionResult
    evidence: EvidenceFusionResult
    timestamp: str

# Waste Item Register Request
class RegisterWasteRequest(BaseModel):
    object_type: str
    category_code: str
    department_name: str = "ICU"
    weight_kg: float = 0.25
    rfid_tag: Optional[str] = None
    barcode: Optional[str] = None
    verification_notes: Optional[str] = None

# Waste Passport Response
class WastePassportResponse(BaseModel):
    passport_id: str
    waste_id: str
    object_type: str
    category: str
    department: str
    weight: float
    hazard_level: str
    current_status: str
    qr_code_base64: Optional[str] = None
    created_at: str
    verified_at: Optional[str] = None
    collected_at: Optional[str] = None
    handover_at: Optional[str] = None

# Collection Task
class CollectionTaskResponse(BaseModel):
    task_id: str
    waste_id: str
    department: str
    waste_category: str
    weight_kg: float
    priority_score: float
    priority_level: str
    status: str
    created_at: str

# Bin Telemetry Payload
class BinTelemetryPayload(BaseModel):
    bin_id: str
    department: Optional[str] = "ICU"
    category_code: str
    weight_kg: float
    capacity_percent: float
    battery_level: Optional[float] = 95.0

# Rover Dispatch Request
class RoverDispatchPayload(BaseModel):
    pickup_location: str
    waste_category: str
    waste_weight: float
    priority: str = "HIGH"
    hazard_level: str = "CRITICAL"

# Audit Chain Verification Response
class AuditChainVerificationResponse(BaseModel):
    is_valid: bool
    total_blocks: int
    latest_hash: str
    message: str
