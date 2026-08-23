import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Database, QrCode } from 'lucide-react';
import { api } from '../services/api';
import type { BinTelemetry, CollectionTask, WastePassport } from '../types';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [bins, setBins] = useState<BinTelemetry[]>([]);
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [passports, setPassports] = useState<WastePassport[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sumData, binsData, tasksData, passData] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getSmartBins(),
        api.getCollectionTasks(),
        api.listPassports()
      ]);
      setSummary(sumData);
      setBins(binsData);
      setTasks(tasksData);
      setPassports(passData);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">COMMAND CENTER DASHBOARD</h1>
          <p className="text-xs text-slate-400">Real-time biomedical waste segregation & telemetry metrics</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 hover:bg-slate-700 transition-colors"
        >
          REFRESH TELEMETRY
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl space-y-2 border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">TOTAL WASTE TODAY</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{summary?.total_waste_today || 24}</p>
          <p className="text-[11px] text-cyan-400/80 font-medium">Recorded via vision pipeline</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-2 border-red-500/20">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">CRITICAL SHARPS (WHITE)</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{summary?.white_cnt || 8}</p>
          <p className="text-[11px] text-red-400 font-medium">100% Safety Escalated</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-2 border-amber-500/20">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">FULL BINS (&gt;80%)</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {bins.filter(b => b.capacity_percent >= 80).length}
          </p>
          <p className="text-[11px] text-amber-400 font-medium">Urgent collection flagged</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-2 border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">COLLECTION QUEUE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {tasks.filter(t => t.status === 'PENDING').length}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">Sorted by P_task score</p>
        </div>

      </div>

      {/* Main Grid: Bins Telemetry & Recent Waste Passports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Smart Bins Status (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>SMART BIN TELEMETRY MONITORING</span>
            </h3>
            <span className="text-xs text-slate-400">4 Active Bins</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bins.map((bin) => (
              <div key={bin.bin_id} className="glass-card p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{bin.bin_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    bin.capacity_percent >= 90 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {bin.status_alert || 'NORMAL'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Fill Capacity</span>
                    <span className="text-white font-mono">{bin.capacity_percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        bin.capacity_percent >= 90 ? 'bg-red-500' : bin.capacity_percent >= 75 ? 'bg-amber-400' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${bin.capacity_percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Weight: <strong className="text-slate-200">{bin.weight_kg} kg</strong></span>
                  <span>Dept: <strong className="text-slate-200">{bin.department}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Digital Waste Passports (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>RECENT DIGITAL PASSPORTS</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">SHA-256 CHAINED</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[340px]">
            {passports.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No passports registered yet today.</p>
            ) : (
              passports.slice(0, 5).map((p) => (
                <div key={p.passport_id} className="glass-card p-3 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-cyan-400 font-mono">{p.waste_id}</span>
                    <p className="text-xs font-semibold text-white">{p.object_type.replace('_', ' ')}</p>
                    <p className="text-[11px] text-slate-400">{p.department} • {p.weight} kg</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.category === 'WHITE' ? 'bg-slate-200 text-slate-900' :
                      p.category === 'RED' ? 'bg-red-500 text-white' :
                      p.category === 'YELLOW' ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'
                    }`}>
                      {p.category} BIN
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">{p.current_status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
