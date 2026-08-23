import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import type { CollectionTask } from '../types';

export const CollectionPage: React.FC = () => {
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null);
  const [scannedQr, setScannedQr] = useState<string>('');
  const [completing, setCompleting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getCollectionTasks();
      setTasks(data);
      if (data.length > 0) setSelectedTask(data[0]);
    } catch (e) {
      console.error('Error loading collection tasks', e);
    }
  };

  const handleCompleteCollection = async () => {
    if (!selectedTask) return;
    setCompleting(true);
    setMessage(null);

    try {
      await api.completeCollectionTask(selectedTask.task_id);
      setMessage(`Collection confirmed for Task ${selectedTask.task_id} (${selectedTask.waste_id})`);
      await loadTasks();
    } catch (e) {
      console.error('Error completing collection task', e);
      setMessage('Failed to complete collection task');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">COLLECTION WORKER PORTAL</h1>
          <p className="text-xs text-slate-400">Risk-aware collection task queue sorted by priority score (P_task)</p>
        </div>
        <button
          onClick={loadTasks}
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
        
        {/* Task List (6 Cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            PENDING COLLECTIONS
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {tasks.map((t) => (
              <div
                key={t.task_id}
                onClick={() => setSelectedTask(t)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTask?.task_id === t.task_id
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md'
                    : 'glass-card border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{t.task_id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                    t.priority_level === 'CRITICAL' ? 'bg-red-500 text-white' :
                    t.priority_level === 'HIGH' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    Priority {t.priority_score} ({t.priority_level})
                  </span>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div>
                    <p className="text-xs font-bold text-white">Waste ID: {t.waste_id}</p>
                    <p className="text-[11px] text-slate-400">Ward: {t.department} • {t.weight_kg} kg</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {selectedTask ? (
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold">{selectedTask.task_id}</span>
                <h3 className="text-lg font-black text-white">CONFIRM COLLECTION HANDOVER</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Target Waste ID:</span>
                  <span className="font-bold text-white font-mono">{selectedTask.waste_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Pickup Ward:</span>
                  <span className="font-bold text-white">{selectedTask.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Category Stream:</span>
                  <span className="font-bold text-cyan-400">{selectedTask.waste_category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Weight:</span>
                  <span className="font-bold text-white font-mono">{selectedTask.weight_kg} kg</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Priority Score:</span>
                  <span className="font-bold text-red-400 font-mono">{selectedTask.priority_score} / 100</span>
                </div>
              </div>

              {/* QR Verification Simulation Input */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs text-slate-400 font-medium">Scan / Verify QR Waste ID</label>
                <input
                  type="text"
                  placeholder={selectedTask.waste_id}
                  value={scannedQr}
                  onChange={(e) => setScannedQr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCompleteCollection}
                disabled={completing || selectedTask.status === 'COMPLETED'}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-black text-xs text-slate-950 uppercase tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2"
              >
                {completing ? (
                  <span>RECORDING COLLECTION...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM COLLECTION & UPDATE PASSPORT</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-xs text-slate-500 rounded-2xl">
              Select a task from the collection queue to view pickup details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
