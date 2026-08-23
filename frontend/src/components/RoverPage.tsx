import React, { useState, useEffect } from 'react';
import { Radio, Send } from 'lucide-react';
import { api } from '../services/api';

export const RoverPage: React.FC = () => {
  const [roverStatus, setRoverStatus] = useState<any>(null);
  const [location, setLocation] = useState<string>('ICU Station B');
  const [category, setCategory] = useState<string>('WHITE');
  const [weight, setWeight] = useState<number>(12.4);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRoverStatus();
  }, []);

  const loadRoverStatus = async () => {
    try {
      const res = await api.getRoverStatus();
      setRoverStatus(res);
    } catch (e) {
      console.error('Failed to get rover status', e);
    }
  };

  const handleDispatch = async () => {
    setDispatching(true);
    setMessage(null);

    try {
      const res = await api.dispatchRover({
        pickup_location: location,
        waste_category: category,
        waste_weight: weight,
        priority: 'HIGH',
        hazard_level: category === 'WHITE' ? 'CRITICAL' : 'HIGH'
      });
      setMessage(`Rover Task ${res.task_id} dispatched! Status: DISPATCHED`);
      await loadRoverStatus();
    } catch (e) {
      console.error('Dispatch error', e);
      setMessage('Failed to dispatch rover task');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">MEDWASTE ROVER / AMR COMMAND CENTER</h1>
          <p className="text-xs text-slate-400">Autonomous mobile waste collection robot integration interface</p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
          ROVER OFFLINE (SOFTWARE MODE)
        </span>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Telemetry Card */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>ROVER TELEMETRY</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">{roverStatus?.rover_id || 'MED-ROVER-01'}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-400 font-mono">{roverStatus?.status || 'IDLE'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Battery Level:</span>
              <span className="font-bold text-cyan-400 font-mono">{roverStatus?.battery_percent || 92.5}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Docking Location:</span>
              <span className="font-bold text-white">Central Storage Dock B</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              {roverStatus?.status_text || 'ROVER OFFLINE - Software Simulation Ready'}
            </div>
          </div>
        </div>

        {/* Right Dispatch Form */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>DISPATCH AMR COLLECTION TASK</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Pickup Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Waste Stream</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="WHITE">⚪ WHITE (Sharps)</option>
                <option value="RED">🔴 RED (Plastics)</option>
                <option value="YELLOW">🟡 YELLOW (Infectious)</option>
                <option value="BLUE">🔵 BLUE (Glassware)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Payload Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            {dispatching ? 'DISPATCHING ROVER...' : 'DISPATCH AMR ROVER TASK'}
          </button>
        </div>

      </div>
    </div>
  );
};
