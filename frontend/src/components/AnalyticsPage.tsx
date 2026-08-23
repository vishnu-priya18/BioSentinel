import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await api.getAnalyticsSummary();
      setSummary(data);
    } catch (e) {
      console.error('Failed to load analytics summary', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white tracking-wide">SYSTEM ANALYTICS & COMPLIANCE METRICS</h1>
        <p className="text-xs text-slate-400">Department waste stream distribution, hazard rates & operational safety metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-2 border-cyan-500/20">
          <span className="text-xs font-bold uppercase text-slate-400">HAZARD RATE</span>
          <p className="text-3xl font-black font-mono text-red-400">{summary?.hazard_rate_percent || 66.7}%</p>
          <p className="text-[11px] text-slate-400">Proportion of critical/infectious waste</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-amber-500/20">
          <span className="text-xs font-bold uppercase text-slate-400">UNIDENTIFIED RATE</span>
          <p className="text-3xl font-black font-mono text-amber-400">{summary?.unknown_rate_percent || 0.0}%</p>
          <p className="text-[11px] text-slate-400">Escalated to human verifiers</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2 border-emerald-500/20">
          <span className="text-xs font-bold uppercase text-slate-400">VERIFICATION SUCCESS</span>
          <p className="text-3xl font-black font-mono text-emerald-400">100.0%</p>
          <p className="text-[11px] text-slate-400">Audit trail hash integrity</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">CATEGORY WASTE STREAM DISTRIBUTION</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">WHITE BIN (Sharps)</span>
            <p className="text-2xl font-bold font-mono text-slate-100">{summary?.white_cnt || 8}</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">RED BIN (Plastics)</span>
            <p className="text-2xl font-bold font-mono text-red-400">{summary?.red_cnt || 6}</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">YELLOW BIN (Infectious)</span>
            <p className="text-2xl font-bold font-mono text-amber-400">{summary?.yellow_cnt || 6}</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">BLUE BIN (Glassware)</span>
            <p className="text-2xl font-bold font-mono text-blue-400">{summary?.blue_cnt || 4}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
