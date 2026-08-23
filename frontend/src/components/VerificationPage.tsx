import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { WastePassport } from '../types';

export const VerificationPage: React.FC = () => {
  const [passports, setPassports] = useState<WastePassport[]>([]);
  const [selectedPassport, setSelectedPassport] = useState<WastePassport | null>(null);
  const [targetCategory, setTargetCategory] = useState<string>('WHITE');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEscalatedItems();
  }, []);

  const loadEscalatedItems = async () => {
    try {
      const data = await api.listPassports();
      setPassports(data);
      if (data.length > 0) setSelectedPassport(data[0]);
    } catch (e) {
      console.error('Error loading items for verification', e);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedPassport) return;
    setLoading(true);
    setMessage(null);

    try {
      await api.verifyWasteItem(
        selectedPassport.waste_id,
        action,
        targetCategory,
        notes
      );
      setMessage(`Item ${selectedPassport.waste_id} updated via ${action}`);
      await loadEscalatedItems();
    } catch (e) {
      console.error('Verification submit error', e);
      setMessage('Failed to update verification status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">VERIFICATION QUEUE</h1>
          <p className="text-xs text-slate-400">Review escalated, hazardous & uncertain biomedical waste items</p>
        </div>
        <button
          onClick={loadEscalatedItems}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 hover:bg-slate-700 transition-colors"
        >
          REFRESH QUEUE
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Item Queue List (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            ITEMS AWAITING VERIFICATION
          </h3>

          <div className="space-y-2 overflow-y-auto max-h-[500px]">
            {passports.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Queue empty. All items verified!</p>
            ) : (
              passports.map((p) => (
                <div
                  key={p.passport_id}
                  onClick={() => {
                    setSelectedPassport(p);
                    setTargetCategory(p.category);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPassport?.passport_id === p.passport_id
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md'
                      : 'glass-card border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{p.waste_id}</span>
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                      {p.current_status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-white">{p.object_type.replace('_', ' ')}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {p.category} BIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{p.department} • {p.weight} kg</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Inspector Details & Action Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPassport ? (
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-400">{selectedPassport.passport_id}</span>
                  <h3 className="text-lg font-black text-white">{selectedPassport.object_type.replace('_', ' ')}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Hazard Level</span>
                  <span className="text-xs font-bold text-red-400 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30">
                    {selectedPassport.hazard_level}
                  </span>
                </div>
              </div>

              {/* Details Cards */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Department</span>
                  <span className="font-bold text-white">{selectedPassport.department}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Weight</span>
                  <span className="font-bold text-white font-mono">{selectedPassport.weight} kg</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Current Category</span>
                  <span className="font-bold text-cyan-400">{selectedPassport.category}</span>
                </div>
              </div>

              {/* QR Code Inspection */}
              {selectedPassport.qr_code_base64 && (
                <div className="flex items-center space-x-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <img src={selectedPassport.qr_code_base64} alt="QR Code" className="w-24 h-24 rounded bg-white p-1" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-200">Registered QR Identity</p>
                    <p className="font-mono text-cyan-400">{selectedPassport.waste_id}</p>
                    <p className="text-slate-400 text-[11px]">Lifecycle Status: {selectedPassport.current_status}</p>
                  </div>
                </div>
              )}

              {/* Verifier Action Form */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">VERIFIER DECISION & RECLASSIFICATION</h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Verified Bin Stream</label>
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="WHITE">⚪ WHITE (Sharps)</option>
                      <option value="RED">🔴 RED (Contaminated Plastic)</option>
                      <option value="YELLOW">🟡 YELLOW (Infectious / Anatomical)</option>
                      <option value="BLUE">🔵 BLUE (Glassware / Medicine)</option>
                      <option value="BLACK">⚫ BLACK (General Waste)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Verifier Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Confirmed sharp sheathed"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <button
                    onClick={() => handleAction('APPROVE')}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleAction('RECLASSIFY')}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors"
                  >
                    RECLASSIFY
                  </button>
                  <button
                    onClick={() => handleAction('ESCALATE')}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    ESCALATE
                  </button>
                  <button
                    onClick={() => handleAction('REJECT')}
                    disabled={loading}
                    className="py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors"
                  >
                    REJECT
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-slate-500 text-xs">
              Select an item from the queue to view details & submit verification.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
