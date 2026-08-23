import React from 'react';

export const AnalysisPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Page Title Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-white tracking-wide">AI PREDICTION VS OPERATIONAL SAFETY</h1>
        <p className="text-xs text-slate-400">
          Core Principle Demonstration: High AI confidence does NOT equal operational permission.
        </p>
      </div>

      {/* Comparison Grid: AI Prediction vs Safety Gate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: AI Model Raw Output */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
              <span>1. AI COMPUTER VISION MODEL</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              YOLOv8 DETECTOR
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-300 font-semibold">Answers one question:</p>
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-cyan-300 text-sm border border-slate-800">
              "WHAT OBJECT DO I SEE IN THE FRAME?"
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Class Output:</span>
                <span className="font-bold text-white">SYRINGE</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">AI Confidence:</span>
                <span className="font-bold text-emerald-400 font-mono">96.4% (HIGH)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Bounding Box:</span>
                <span className="font-mono text-slate-300">[x: 140, y: 90, w: 220, h: 310]</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-200">Naïve System Behavior:</p>
              <p className="text-red-400">❌ "Confidence is 96.4% &gt; 80% threshold -&gt; Automatically unlock White Bin!"</p>
              <p className="text-slate-400 italic">DANGER: Ignores physical sharps puncture risk & bio-containment rules!</p>
            </div>
          </div>
        </div>

        {/* Right Side: Operational Safety Engine */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 border-red-500/30">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center space-x-2">
              <span>2. BIO SENTINEL-X SAFETY GATE</span>
            </h3>
            <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
              POLICY ENGINE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-300 font-semibold">Answers three safety questions:</p>
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-amber-300 text-sm border border-slate-800 space-y-1">
              <p>"IS IT SAFE TO AUTOMATE?"</p>
              <p>"DOES IT REQUIRE CONTROLLED HANDLING?"</p>
              <p>"IS THERE CROSS-SENSOR CONFLICT?"</p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-bold">
                <span>Hazard Assessment:</span>
                <span>CRITICAL SHARP</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-bold">
                <span>Automation Allowed:</span>
                <span>FALSE (BLOCKED)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span>Final State:</span>
                <span className="font-bold text-amber-400 font-mono">HIGH_RISK_ESCALATION</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <p className="font-bold text-emerald-400">✓ Bio Sentinel-X Enforced Invariant:</p>
              <p className="font-mono text-slate-200">
                IF critical_hazard == true THEN decision != SAFE_TO_AUTOMATE
              </p>
              <p className="text-slate-400">Forces controlled human verifier sign-off and locks automated chute.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Architectural Flowchart Diagram Card */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">END-TO-END DECISION HIERARCHY FLOW</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-center font-mono font-bold">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-cyan-400">STEP 1</span>
            <p className="text-white">CAMERA CAPTURE</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-cyan-400">STEP 2</span>
            <p className="text-white">YOLO INFERENCE</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-amber-400">STEP 3</span>
            <p className="text-white">HAZARD GATE</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-red-400">STEP 4</span>
            <p className="text-white">POLICY ENGINE</p>
          </div>
        </div>
      </div>

    </div>
  );
};
