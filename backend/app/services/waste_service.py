import io
import base64
import datetime
import qrcode
from PIL import Image
from sqlalchemy.orm import Session

from backend.app.domain.intelligence.classifier_adapter import ClassifierAdapter
from backend.app.domain.compliance.waste_category_mapper import DeterministicWasteCategoryMapper
from backend.app.domain.safety.hazard_gate import HazardGate
from backend.app.domain.evidence.evidence_fusion_engine import EvidenceFusionEngine
from backend.app.domain.decision.policy_engine import PolicyEngine
from backend.app.domain.decision.reasoning_panel_engine import ReasoningPanelEngine
from backend.app.domain.decision.counterfactual_engine import CounterfactualEngine
from backend.app.domain.audit.audit_chain_service import AuditChainService
from backend.app.models.models import WasteItem, WastePassport, CollectionTask, Alert

class WasteService:
    def __init__(self):
        self.classifier_adapter = ClassifierAdapter()
        self.category_mapper = DeterministicWasteCategoryMapper()
        self.hazard_gate = HazardGate()
        self.evidence_engine = EvidenceFusionEngine()
        self.policy_engine = PolicyEngine()
        self.reasoning_engine = ReasoningPanelEngine()
        self.counterfactual_engine = CounterfactualEngine()
        self.audit_service = AuditChainService()

    def process_image_bytes(
        self,
        db: Session,
        image_bytes: bytes,
        barcode: str = None,
        weight_kg: float = None,
        department: str = "ICU",
        is_opaque_bag: bool = False
    ):
        # 1. Load image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # 2. Vision analysis (returns all detected objects)
        cv_result = self.classifier_adapter.analyze_frame(image)
        model_installed = cv_result["model_installed"]
        all_detections = cv_result.get("all_detections", [cv_result["object"]])

        # 3. Multi-object prioritization: Critical Sharp > Biohazard > Plastic > Glass
        primary = all_detections[0]
        for det in all_detections:
            hazard_eval = self.hazard_gate.evaluate_hazard(det["class_name"])
            if hazard_eval.get("is_sharp", False):
                primary = det
                break

        object_name = primary["class_name"].lower()
        confidence = primary["confidence"]

        # 4. Deterministic Waste Category Stream
        category = self.category_mapper.get_category_for_object(object_name)

        # 5. Hazard Safety Gate
        hazard_info = self.hazard_gate.evaluate_hazard(object_name)

        # 6. Evidence Fusion
        evidence_info = self.evidence_engine.fuse_evidence(
            vision_category=category["code"],
            vision_confidence=confidence,
            barcode=barcode,
            weight_kg=weight_kg,
            is_opaque_bag=is_opaque_bag,
            department=department
        )

        # 7. Deterministic Policy Decision
        decision_info = self.policy_engine.evaluate_decision(
            object_name=object_name,
            confidence=confidence,
            hazard_info=hazard_info,
            evidence_info=evidence_info,
            is_opaque_bag=is_opaque_bag,
            model_installed=model_installed
        )

        # 8. Reasoning Checklist
        why_checklist = self.reasoning_engine.build_why_checklist(
            object_name=object_name,
            confidence=confidence,
            category_info=category,
            hazard_info=hazard_info,
            decision_info=decision_info,
            evidence_info=evidence_info
        )

        # 9. Counterfactual Guidance
        what_safe_checklist = self.counterfactual_engine.build_counterfactual_recommendations(
            object_name=object_name,
            confidence=confidence,
            hazard_info=hazard_info,
            decision_info=decision_info,
            evidence_info=evidence_info
        )

        # Log Audit Event
        self.audit_service.add_event(
            db=db,
            event_type="AI_ANALYZED",
            payload={
                "object": object_name,
                "confidence": confidence,
                "category": category["code"],
                "hazard": hazard_info["severity"],
                "decision": decision_info["state"],
                "all_detections": [d["class_name"] for d in all_detections]
            }
        )

        return {
            "model_installed": model_installed,
            "object": primary,
            "all_detections": all_detections,
            "category": category,
            "hazard": hazard_info,
            "decision": {
                "state": decision_info["state"],
                "automation_allowed": decision_info["automation_allowed"],
                "reason": decision_info["reason"],
                "why_checklist": why_checklist,
                "what_safe_checklist": what_safe_checklist
            },
            "evidence": evidence_info,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    def register_waste_item(
        self,
        db: Session,
        object_type: str,
        category_code: str,
        department_name: str = "ICU",
        weight_kg: float = 0.25,
        rfid_tag: str = None,
        barcode: str = None,
        verification_notes: str = None
    ) -> WastePassport:
        count = db.query(WasteItem).count() + 1
        waste_id = f"MW-2026-{count:06d}"

        status = "AWAITING_COLLECTION" if category_code != "UNKNOWN" else "VERIFICATION_REQUIRED"

        waste_item = WasteItem(
            waste_id=waste_id,
            object_type=object_type,
            category_code=category_code,
            department_name=department_name,
            weight_kg=weight_kg,
            rfid_tag=rfid_tag,
            barcode=barcode,
            status=status
        )
        db.add(waste_item)
        db.commit()

        qr_img = qrcode.make(waste_id)
        buffered = io.BytesIO()
        qr_img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        passport_id = f"WP-{waste_id}"
        passport = WastePassport(
            passport_id=passport_id,
            waste_id=waste_id,
            object_type=object_type,
            category=category_code,
            department=department_name,
            weight=weight_kg,
            hazard_level="CRITICAL" if category_code == "WHITE" else "HIGH",
            current_status=status,
            qr_code_base64=f"data:image/png;base64,{qr_base64}"
        )
        db.add(passport)
        db.commit()

        return passport
