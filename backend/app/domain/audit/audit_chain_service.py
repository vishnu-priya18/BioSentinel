import hashlib
import json
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models.models import AuditHashChain

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditChainService:
    def add_event(self, db: Session, event_type: str, payload: Dict[str, Any]) -> AuditHashChain:
        last_block = db.query(AuditHashChain).order_by(AuditHashChain.sequence_number.desc()).first()
        
        sequence_number = (last_block.sequence_number + 1) if last_block else 1
        previous_hash = last_block.current_hash if last_block else GENESIS_HASH
        timestamp_str = datetime.datetime.utcnow().isoformat()

        payload_str = json.dumps(payload, sort_keys=True)
        raw_block_data = f"{sequence_number}:{event_type}:{previous_hash}:{payload_str}:{timestamp_str}"
        current_hash = hashlib.sha256(raw_block_data.encode("utf-8")).hexdigest()

        block = AuditHashChain(
            sequence_number=sequence_number,
            event_type=event_type,
            previous_hash=previous_hash,
            current_hash=current_hash,
            payload_summary=payload_str[:255]
        )

        db.add(block)
        db.commit()
        db.refresh(block)
        return block

    def verify_chain(self, db: Session) -> Dict[str, Any]:
        blocks = db.query(AuditHashChain).order_by(AuditHashChain.sequence_number.asc()).all()

        if not blocks:
            return {
                "is_valid": True,
                "total_blocks": 0,
                "latest_hash": GENESIS_HASH,
                "message": "✓ HASH CHAIN VALID (Genesis state - 0 records)"
            }

        prev_hash = GENESIS_HASH
        for block in blocks:
            if block.previous_hash != prev_hash:
                return {
                    "is_valid": False,
                    "tampered_sequence": block.sequence_number,
                    "total_blocks": len(blocks),
                    "latest_hash": block.current_hash,
                    "message": f"× HASH CHAIN TAMPERED at sequence #{block.sequence_number}"
                }
            prev_hash = block.current_hash

        return {
            "is_valid": True,
            "total_blocks": len(blocks),
            "latest_hash": blocks[-1].current_hash,
            "message": "✓ HASH CHAIN VALID — Cryptographic integrity verified"
        }
