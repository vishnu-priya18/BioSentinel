import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { AuditBlock } from '../types';

export const AuditPage: React.FC = () => {
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    loadAuditTrail();
  }, []);

  const loadAuditTrail = async () => {
    try {
      const data = await api.getAuditTrail();
      setBlocks(data);
      const vRes = await api.verifyAuditChain();
      setVerification(vRes);
    } catch (e) {
      console.error('Failed to load audit trail', e);
    }
  };

  const handleRunVerification = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerification(res);
    } catch (e) {
      console.error('Verification failed', e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">SHA-256 CRYPTOGRAPHIC AUDIT TRAIL</h1>
          <p className="text-xs text-slate-400">Block-style immutable hash chain for biomedical waste events</p>
        </div>
        <button
          onClick={handleRunVerification}
          disabled={verifying}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-slate-950 hover:brightness-110 transition-all flex items-center space-x-2 shadow-md shadow-cyan-500/20"
        >
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{verifying ? 'VERIFYING CHAIN...' : 'VERIFY HASH CHAIN'}</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {verification && (
        <div className={`p-4 rounded-2xl border flex items-center space-x-4 ${
          verification.is_valid
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-400'
        }`}>
          {verification.is_valid ? (
            <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
          )}
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold tracking-wide uppercase">{verification.message}</h3>
            <p className="text-xs opacity-90 font-mono">
              Total Chained Event Blocks: {verification.total_blocks} | Latest Root Hash: {verification.latest_hash?.substring(0, 24)}...
            </p>
          </div>
        </div>
      )}

      {/* Hash Chain Blocks List */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
          EVENT BLOCK CHAIN LOG
        </h3>

        <div className="space-y-3 font-mono text-xs overflow-y-auto max-h-[500px]">
          {blocks.length === 0 ? (
            <p className="text-slate-500 text-center py-8 font-sans">No audit events recorded yet. Run a waste scan to generate blocks!</p>
          ) : (
            blocks.map((block) => (
              <div key={block.sequence_number} className="glass-card p-4 rounded-xl space-y-2 border-slate-800">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold text-cyan-400">BLOCK #{block.sequence_number}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-bold">{block.event_type}</span>
                  <span className="text-[11px] text-slate-500">{new Date(block.created_at).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">PREVIOUS HASH</span>
                    <span className="text-slate-400 truncate block">{block.previous_hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT HASH</span>
                    <span className="text-emerald-400 font-bold truncate block">{block.current_hash}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans pt-1">
                  Payload Summary: <span className="text-slate-200">{block.payload_summary}</span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
