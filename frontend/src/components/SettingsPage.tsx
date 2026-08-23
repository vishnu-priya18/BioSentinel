import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [installing, setInstalling] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadModelStatus();
  }, []);

  const loadModelStatus = async () => {
    try {
      const res = await api.getModelStatus();
      setModelStatus(res);
    } catch (e) {
      console.error('Error loading model status', e);
    }
  };

  const handleInstallModel = async () => {
    setInstalling(true);
    setMessage(null);
    try {
      const res = await api.initDefaultModel();
      setMessage(res.message);
      await loadModelStatus();
    } catch (e: any) {
      setMessage('Failed to install model');
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white tracking-wide">SYSTEM SETTINGS & MODEL REGISTRY</h1>
        <p className="text-xs text-slate-400">ML Model configuration, waste category mapping rules & hardware simulation toggles</p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400">
          {message}
        </div>
      )}

      {/* Model Registry Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>BIOMEDICAL VISION MODEL REGISTRY</span>
          </h3>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
            modelStatus?.installed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {modelStatus?.installed ? 'ONLINE' : 'NOT INSTALLED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Model File</span>
            <span className="font-mono font-bold text-white">{modelStatus?.filename || 'best.pt'}</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Architecture</span>
            <span className="font-bold text-cyan-400">{modelStatus?.architecture || 'YOLOv8 Object Detector'}</span>
          </div>
        </div>

        <button
          onClick={handleInstallModel}
          disabled={installing}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-slate-950 uppercase shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center space-x-2"
        >
          {installing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>{installing ? 'INSTALLING MODEL...' : 'INSTALL / RE-INITIALIZE YOLOV8 MODEL'}</span>
        </button>
      </div>

      {/* Waste Stream Mapping Reference */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">CONFIGURED WASTE CATEGORIES (waste_categories.json)</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-slate-100">⚪ WHITE (Sharps)</span>
            <p className="text-[11px] text-slate-400">SYRINGE, NEEDLE, SCALPEL, BLADE, LANCET</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-red-400">🔴 RED (Plastics)</span>
            <p className="text-[11px] text-slate-400">IV_TUBE, IV_SET, GLOVE, MASK, URINE_BAG</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">🟡 YELLOW (Infectious)</span>
            <p className="text-[11px] text-slate-400">BLOOD_GAUZE, ANATOMICAL, BLOOD_BAG</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-blue-400">🔵 BLUE (Glassware)</span>
            <p className="text-[11px] text-slate-400">BROKEN_GLASS, GLASS_VIAL, MEDICINE_BOTTLE</p>
          </div>
        </div>
      </div>

    </div>
  );
};
