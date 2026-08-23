export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectDetectionResult {
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface CategoryInfo {
  code: string;
  name: string;
  bin_color: string;
  hex_color: string;
  hazard_level: string;
  autoclave_required: boolean;
  incineration_required: boolean;
}

export interface HazardAssessmentResult {
  detected: boolean;
  type: string;
  severity: string;
  is_sharp: boolean;
  is_infectious: boolean;
  automation_allowed: boolean;
}

export interface DecisionResult {
  state: 'SAFE_TO_AUTOMATE' | 'NEEDS_VERIFICATION' | 'HIGH_RISK_ESCALATION' | 'UNKNOWN' | 'SYSTEM_ERROR';
  automation_allowed: boolean;
  reason: string;
  why_checklist: Array<{
    status: 'PASS' | 'WARN' | 'FAIL';
    label: string;
    details: string;
  }>;
  what_safe_checklist: string[];
}

export interface EvidenceFusionResult {
  support: boolean;
  conflict: boolean;
  missing: boolean;
  summary: string;
  details: Record<string, any>;
}

export interface WasteAnalysisResponse {
  model_installed: boolean;
  object: ObjectDetectionResult;
  category: CategoryInfo;
  hazard: HazardAssessmentResult;
  decision: DecisionResult;
  evidence: EvidenceFusionResult;
  timestamp: string;
}

export interface WastePassport {
  passport_id: string;
  waste_id: string;
  object_type: string;
  category: string;
  department: string;
  weight: number;
  hazard_level: string;
  current_status: string;
  qr_code_base64?: string;
  created_at: string;
  verified_at?: string;
  collected_at?: string;
  handover_at?: string;
}

export interface CollectionTask {
  id: number;
  task_id: string;
  waste_id: string;
  department: string;
  waste_category: string;
  weight_kg: number;
  priority_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
}

export interface BinTelemetry {
  bin_id: string;
  department: string;
  category_code: string;
  weight_kg: number;
  capacity_percent: number;
  battery_level: number;
  status_alert?: string;
}

export interface AuditBlock {
  sequence_number: number;
  event_type: string;
  previous_hash: string;
  current_hash: string;
  payload_summary: string;
  created_at: string;
}
