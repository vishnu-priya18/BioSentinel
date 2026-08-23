import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { api } from '../services/api';
import type { BinTelemetry } from '../types';

export const BinsPage: React.FC = () => {
  const [bins, setBins] = useState<BinTelemetry[]>([]);
  const [selectedBin, setSelectedBin] = useState<string>('BIN-ICU-WHITE-01');
  const [newCapacity, setNewCapacity] = useState<number>(85);
  const [newWeight, setNewWeight] = useState<number>(18.5);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadBins();
  }, []);

  const loadBins = async () => {
    try {
      const data = await api.getSmartBins();
      setBins(data);
    } catch (e) {
      console.error('Failed to load bin telemetry', e);
    }
  };

  const handleSimulateTelemetry = async () => {
    setSimulating(true);
    setMessage(null);
    try {
      const targetBin = bins.find(b => b.bin_id === selectedBin);
      await api.sendBinTelemetry({
        bin_id: selectedBin,
        category_code: targetBin?.category_code || 'WHITE',
        weight_kg: newWeight,
        capacity_percent: newCapacity,
        department: targetBin?.department || 'ICU'
      });
      setMessage(`Telemetry updated for ${selectedBin}. Capacity: ${newCapacity}%`);
      await loadBins();
    } catch (e) {
      console.error('Error simulating bin telemetry', e);
      setMessage('Failed to send telemetry payload');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">SMART BIN TELEMETRY</h1>
          <p className="text-xs text-slate-400">IoT sensor monitoring for capacity, weight & urgent collection triggers</p>
        </div>
        <button
          onClick={loadBins}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 hover:bg-slate-700 transition-colors"
        >
          REFRESH SENSORS
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          {message}
        </div>
      )}

      {/* Grid of Bins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bins.map((bin) => (
          <div key={bin.bin_id} className="glass-panel p-5 rounded-2xl space-y-4 border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">{bin.bin_id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                bin.capacity_percent >= 95 ? 'bg-red-500 text-white' :
                bin.capacity_percent >= 80 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {bin.capacity_percent >= 95 ? 'URGENT' : bin.capacity_percent >= 80 ? 'NEAR FULL' : 'NORMAL'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Fill Capacity</span>
                <span className="text-cyan-400 font-mono font-bold">{bin.capacity_percent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    bin.capacity_percent >= 90 ? 'bg-red-500' : bin.capacity_percent >= 75 ? 'bg-amber-400' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${bin.capacity_percent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Weight</span>
                <span className="font-bold text-slate-200 font-mono">{bin.weight_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">Battery</span>
                <span className="font-bold text-emerald-400 font-mono">{bin.battery_level}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* IoT Telemetry Simulation API POST Form */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
          <Send className="w-4 h-4 text-cyan-400" />
          <span>SIMULATE IOT BIN TELEMETRY (POST /api/bins/telemetry)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Select Target Bin</label>
            <select
              value={selectedBin}
              onChange={(e) => setSelectedBin(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              {bins.map((b) => (
                <option key={b.bin_id} value={b.bin_id}>
                  {b.bin_id} ({b.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Capacity %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newCapacity}
              onChange={(e) => setNewCapacity(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Weight (kg)</label>
            <input
              type="number"
              step="0.5"
              value={newWeight}
              onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          onClick={handleSimulateTelemetry}
          disabled={simulating}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-slate-950 uppercase shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
        >
          {simulating ? 'SENDING TELEMETRY...' : 'POST TELEMETRY PAYLOAD'}
        </button>
      </div>

    </div>
  );
};
