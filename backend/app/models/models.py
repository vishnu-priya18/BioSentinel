import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True) # ADMIN, SUPERVISOR, WORKER, VERIFIER, VIEWER
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id"))
    department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class Hospital(Base):
    __tablename__ = "hospitals"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    license_code: Mapped[str] = mapped_column(String, unique=True)
    address: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hospital_id: Mapped[int] = mapped_column(Integer, ForeignKey("hospitals.id"))
    name: Mapped[str] = mapped_column(String, index=True) # ICU, Emergency, Surgery, Oncology, Lab, Ward-3
    criticality_score: Mapped[float] = mapped_column(Float, default=1.0) # 1.0 (Low) to 3.0 (Critical)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class WasteCategoryModel(Base):
    __tablename__ = "waste_categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True) # WHITE, RED, YELLOW, BLUE, BLACK, UNKNOWN
    name: Mapped[str] = mapped_column(String)
    hazard_level: Mapped[str] = mapped_column(String)
    bin_color: Mapped[str] = mapped_column(String)
    hex_color: Mapped[str] = mapped_column(String)

class WasteItem(Base):
    __tablename__ = "waste_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    waste_id: Mapped[str] = mapped_column(String, unique=True, index=True) # MW-2026-000001
    object_type: Mapped[str] = mapped_column(String, index=True) # SYRINGE, IV_TUBE, etc.
    category_code: Mapped[str] = mapped_column(String, index=True) # WHITE, RED, etc.
    department_name: Mapped[str] = mapped_column(String, default="ICU")
    weight_kg: Mapped[float] = mapped_column(Float, default=0.25)
    rfid_tag: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    barcode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    status: Mapped[str] = mapped_column(String, default="CREATED") # CREATED, VERIFICATION_REQUIRED, VERIFIED, AWAITING_COLLECTION, COLLECTED, IN_STORAGE, HANDED_OVER, COMPLETED

class ObjectDetection(Base):
    __tablename__ = "object_detections"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    waste_item_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("waste_items.id"), nullable=True)
    class_name: Mapped[str] = mapped_column(String)
    confidence: Mapped[float] = mapped_column(Float)
    bbox: Mapped[dict] = mapped_column(JSON) # {x, y, width, height}
    model_version: Mapped[str] = mapped_column(String, default="YOLOv8-MedWaste-v1")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class HazardAssessment(Base):
    __tablename__ = "hazard_assessments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    object_name: Mapped[str] = mapped_column(String)
    is_sharp: Mapped[bool] = mapped_column(Boolean, default=False)
    is_infectious: Mapped[bool] = mapped_column(Boolean, default=False)
    hazard_severity: Mapped[str] = mapped_column(String) # CRITICAL, HIGH, MODERATE, LOW
    automation_allowed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class DecisionRecord(Base):
    __tablename__ = "decisions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    waste_item_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("waste_items.id"), nullable=True)
    state: Mapped[str] = mapped_column(String) # SAFE_TO_AUTOMATE, NEEDS_VERIFICATION, HIGH_RISK_ESCALATION, UNKNOWN, SYSTEM_ERROR
    automation_allowed: Mapped[bool] = mapped_column(Boolean)
    reason: Mapped[str] = mapped_column(Text)
    why_checklist: Mapped[dict] = mapped_column(JSON)
    what_safe_checklist: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class VerificationEvent(Base):
    __tablename__ = "verification_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    waste_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("waste_items.id"))
    verifier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String) # APPROVE, RECLASSIFY, REJECT, ESCALATE
    original_category: Mapped[str] = mapped_column(String)
    verified_category: Mapped[str] = mapped_column(String)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class WastePassport(Base):
    __tablename__ = "waste_passports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    passport_id: Mapped[str] = mapped_column(String, unique=True, index=True) # WP-2026-000001
    waste_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    object_type: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    weight: Mapped[float] = mapped_column(Float)
    hazard_level: Mapped[str] = mapped_column(String)
    current_status: Mapped[str] = mapped_column(String)
    qr_code_base64: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    verified_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    handover_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

class CollectionTask(Base):
    __tablename__ = "collection_tasks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    waste_id: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    waste_category: Mapped[str] = mapped_column(String)
    weight_kg: Mapped[float] = mapped_column(Float)
    priority_score: Mapped[float] = mapped_column(Float)
    priority_level: Mapped[str] = mapped_column(String) # CRITICAL, HIGH, MEDIUM, LOW
    status: Mapped[str] = mapped_column(String, default="PENDING") # PENDING, ASSIGNED, IN_PROGRESS, COMPLETED
    assigned_worker_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

class BinTelemetry(Base):
    __tablename__ = "bin_telemetry"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bin_id: Mapped[str] = mapped_column(String, index=True) # BIN-ICU-WHITE-01
    department: Mapped[str] = mapped_column(String, default="ICU")
    category_code: Mapped[str] = mapped_column(String) # WHITE, RED, etc.
    weight_kg: Mapped[float] = mapped_column(Float)
    capacity_percent: Mapped[float] = mapped_column(Float)
    battery_level: Mapped[float] = mapped_column(Float, default=95.0)
    status_alert: Mapped[Optional[str]] = mapped_column(String, nullable=True) # BIN_NEAR_CAPACITY, URGENT_COLLECTION, NORMAL
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class RoverTask(Base):
    __tablename__ = "rover_tasks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rover_id: Mapped[str] = mapped_column(String, default="MED-ROVER-01")
    task_id: Mapped[str] = mapped_column(String, unique=True)
    pickup_location: Mapped[str] = mapped_column(String)
    waste_category: Mapped[str] = mapped_column(String)
    waste_weight: Mapped[float] = mapped_column(Float)
    hazard_level: Mapped[str] = mapped_column(String)
    priority: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="IDLE") # IDLE, DISPATCHED, EN_ROUTE, ARRIVED, COLLECTING, RETURNING, COMPLETED
    dispatched_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class RfidEvent(Base):
    __tablename__ = "rfid_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rfid_id: Mapped[str] = mapped_column(String, index=True)
    waste_id: Mapped[str] = mapped_column(String)
    matched: Mapped[bool] = mapped_column(Boolean)
    event_type: Mapped[str] = mapped_column(String) # SCAN, MISMATCH, VERIFIED
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class HandoverEvent(Base):
    __tablename__ = "handover_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    waste_id: Mapped[str] = mapped_column(String)
    carrier_name: Mapped[str] = mapped_column(String)
    treatment_facility: Mapped[str] = mapped_column(String)
    manifest_number: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_type: Mapped[str] = mapped_column(String) # BIN_FULL, CATEGORY_CONFLICT, WEIGHT_ANOMALY, RFID_MISMATCH, HIGH_HAZARD
    severity: Mapped[str] = mapped_column(String) # CRITICAL, WARNING, INFO
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(Text)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String, index=True) # WASTE_CREATED, AI_ANALYZED, etc.
    entity_id: Mapped[str] = mapped_column(String)
    actor: Mapped[str] = mapped_column(String, default="SYSTEM")
    payload: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class AuditHashChain(Base):
    __tablename__ = "audit_hash_chain"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sequence_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String)
    previous_hash: Mapped[str] = mapped_column(String)
    current_hash: Mapped[str] = mapped_column(String)
    payload_summary: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String, unique=True, index=True)
    value: Mapped[str] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
