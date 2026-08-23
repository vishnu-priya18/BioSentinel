import axios from 'axios';
import type { WasteAnalysisResponse, WastePassport, CollectionTask, BinTelemetry, AuditBlock } from '../types';

const API_BASE = '/api';

export const api = {
  getModelStatus: async () => {
    const res = await axios.get(`${API_BASE}/system/model-status`);
    return res.data;
  },

  initDefaultModel: async () => {
    const res = await axios.post(`${API_BASE}/system/init-default-model`);
    return res.data;
  },

  analyzeImage: async (formData: FormData): Promise<WasteAnalysisResponse> => {
    const res = await axios.post<WasteAnalysisResponse>(`${API_BASE}/detection/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  registerWaste: async (payload: {
    object_type: string;
    category_code: string;
    department_name: string;
    weight_kg: number;
    barcode?: string;
    rfid_tag?: string;
  }): Promise<WastePassport> => {
    const res = await axios.post<WastePassport>(`${API_BASE}/waste-events`, payload);
    return res.data;
  },

  getPassport: async (id: string): Promise<WastePassport> => {
    const res = await axios.get<WastePassport>(`${API_BASE}/passports/${id}`);
    return res.data;
  },

  listPassports: async (): Promise<WastePassport[]> => {
    const res = await axios.get<WastePassport[]>(`${API_BASE}/passports`);
    return res.data;
  },

  verifyWasteItem: async (waste_id: string, action: string, verified_category: string, notes?: string) => {
    const res = await axios.post(`${API_BASE}/verification`, null, {
      params: { waste_id, action, verified_category, notes }
    });
    return res.data;
  },

  getCollectionTasks: async (): Promise<CollectionTask[]> => {
    const res = await axios.get<CollectionTask[]>(`${API_BASE}/collection/tasks`);
    return res.data;
  },

  completeCollectionTask: async (task_id: string) => {
    const res = await axios.post(`${API_BASE}/collection/tasks/${task_id}/complete`);
    return res.data;
  },

  getSmartBins: async (): Promise<BinTelemetry[]> => {
    const res = await axios.get<BinTelemetry[]>(`${API_BASE}/bins`);
    return res.data;
  },

  sendBinTelemetry: async (payload: { bin_id: string; category_code: string; weight_kg: number; capacity_percent: number; department?: string }) => {
    const res = await axios.post(`${API_BASE}/bins/telemetry`, payload);
    return res.data;
  },

  dispatchRover: async (payload: { pickup_location: string; waste_category: string; waste_weight: number; priority: string; hazard_level: string }) => {
    const res = await axios.post(`${API_BASE}/rover/dispatch`, payload);
    return res.data;
  },

  getRoverStatus: async () => {
    const res = await axios.get(`${API_BASE}/rover/status`);
    return res.data;
  },

  getAuditTrail: async (): Promise<AuditBlock[]> => {
    const res = await axios.get<AuditBlock[]>(`${API_BASE}/audit`);
    return res.data;
  },

  verifyAuditChain: async () => {
    const res = await axios.post(`${API_BASE}/audit/verify`);
    return res.data;
  },

  getAnalyticsSummary: async () => {
    const res = await axios.get(`${API_BASE}/analytics/summary`);
    return res.data;
  }
};
