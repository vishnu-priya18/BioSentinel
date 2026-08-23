import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import type { WastePassport } from '../types';

export const PassportPage: React.FC = () => {
  const [passports, setPassports] = useState<WastePassport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPassport, setSelectedPassport] = useState<WastePassport | null>(null);

  useEffect(() => {
    loadPassports();
  }, []);

  const loadPassports = async () => {
    try {
      const data = await api.listPassports();
      setPassports(data);
      if (data.length > 0) setSelectedPassport(data[0]);
    } catch (e) {
      console.error('Failed to load passports', e);
    }
  };

  const filteredPassports = passports.filter(
    (p) => p.waste_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.passport_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lifecycleStages = [
    { code: 'CREATED', label: 'Created' },
    { code: 'VERIFICATION_REQUIRED', label: 'Verification' },
    { code: 'VERIFIED', label: 'Verified' },
    { code: 'AWAITING_COLLECTION', label: 'Awaiting Collection' },
    { code: 'COLLECTED', label: 'Collected' },
    { code: 'COMPLETED', label: 'Completed' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">DIGITAL WASTE PASSPORTS</h1>
          <p className="text-xs text-slate-400">Cryptographically verifiable chain-of-custody for biomedical waste items</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search MW-2026-..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            PASSPORT REGISTRY
          </h3>
          <div className="space-y-2 overflow-y-auto max-h-[520px]">
            {filteredPassports.map((p) => (
              <div
                key={p.passport_id}
                onClick={() => setSelectedPassport(p)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedPassport?.passport_id === p.passport_id
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{p.waste_id}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {p.category} BIN
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-bold text-white">{p.object_type.replace('_', ' ')}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{p.current_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Details Passport Card */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPassport ? (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400 block font-bold">{selectedPassport.passport_id}</span>
                  <h3 className="text-xl font-black text-white">{selectedPassport.waste_id}</h3>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
                  {selectedPassport.category} STREAM
                </span>
              </div>

              {/* QR Code & Passport Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                {selectedPassport.qr_code_base64 && (
                  <div className="text-center space-y-2">
                    <img src={selectedPassport.qr_code_base64} alt="QR Code" className="w-36 h-36 rounded-lg bg-white p-2 mx-auto shadow-md" />
                    <p className="text-[11px] font-mono text-slate-400">Encodes ID: {selectedPassport.waste_id}</p>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Object Class:</span>
                    <span className="font-bold text-white">{selectedPassport.object_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-bold text-white">{selectedPassport.department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Weight:</span>
                    <span className="font-bold text-white font-mono">{selectedPassport.weight} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Hazard Rating:</span>
                    <span className="font-bold text-red-400">{selectedPassport.hazard_level}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Created:</span>
                    <span className="font-mono text-slate-300">{new Date(selectedPassport.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">PASSPORT LIFECYCLE PROGRESSION</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                  {lifecycleStages.map((stage) => (
                    <div key={stage.code} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mx-auto" />
                      <p className="text-[10px] font-bold text-slate-300">{stage.label}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-xs text-slate-500 rounded-2xl">
              Select a passport from the left panel to inspect details and QR code.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
