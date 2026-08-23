import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, AlertCircle, PackageCheck, Zap, Lock, Info } from 'lucide-react';
import { api } from '../services/api';
import type { WasteAnalysisResponse, WastePassport } from '../types';

export const ScanPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<WasteAnalysisResponse | null>(null);
  const [registeredPassport, setRegisteredPassport] = useState<WastePassport | null>(null);

  // Form Inputs for Evidence Fusion
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [weightInput, setWeightInput] = useState<number>(0.25);
  const [departmentInput, setDepartmentInput] = useState<string>('ICU');
  const [isOpaqueBag, setIsOpaqueBag] = useState<boolean>(false);

  const [modelStatus, setModelStatus] = useState<any>(null);
  const [installingModel, setInstallingModel] = useState<boolean>(false);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const res = await api.getModelStatus();
      setModelStatus(res);
    } catch (e) {
      console.error('Failed to get model status', e);
    }
  };

  const handleInstallDefaultModel = async () => {
    setInstallingModel(true);
    try {
      await api.initDefaultModel();
      await checkModelStatus();
    } catch (e) {
      console.error('Error installing model', e);
    } finally {
      setInstallingModel(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in browser settings.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setRegisteredPassport(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);

    try {
      const formData = new FormData();
      formData.append('image_base64', base64Image);
      if (barcodeInput) formData.append('barcode', barcodeInput);
      if (weightInput) formData.append('weight_kg', weightInput.toString());
      if (departmentInput) formData.append('department', departmentInput);
      formData.append('is_opaque_bag', isOpaqueBag ? 'true' : 'false');

      const data = await api.analyzeImage(formData);
      setAnalysisResult(data);

      // Draw bounding box on canvas if present
      if (data.object && data.object.bbox) {
        drawBoundingBox(ctx, data.object);
      }

    } catch (e) {
      console.error('Analysis request error', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const drawBoundingBox = (ctx: CanvasRenderingContext2D, object: any) => {
    const { bbox, class_name, confidence } = object;
    if (bbox.width === 0 && bbox.height === 0) return;

    // Draw box
    ctx.strokeStyle = '#06b6d4'; // Cyan glow
    ctx.lineWidth = 4;
    ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

    // Label banner
    ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
    ctx.fillRect(bbox.x, Math.max(0, bbox.y - 28), Math.max(160, bbox.width), 28);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${class_name} ${Math.round(confidence * 100)}%`, bbox.x + 8, Math.max(18, bbox.y - 8));
  };

  const handleRegisterWaste = async () => {
    if (!analysisResult) return;
    try {
      const passport = await api.registerWaste({
        object_type: analysisResult.object.class_name,
        category_code: analysisResult.category.code,
        department_name: departmentInput,
        weight_kg: weightInput,
        barcode: barcodeInput
      });
      setRegisteredPassport(passport);
    } catch (e) {
      console.error('Registration failed', e);
    }
  };

  const getBinBadgeClass = (code: string) => {
    switch (code) {
      case 'WHITE': return 'bg-slate-100 text-slate-900 border-slate-300 shadow-slate-200/50';
      case 'RED': return 'bg-red-600 text-white border-red-500 shadow-red-500/50';
      case 'YELLOW': return 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/50';
      case 'BLUE': return 'bg-blue-600 text-white border-blue-500 shadow-blue-500/50';
      case 'BLACK': return 'bg-slate-900 text-slate-100 border-slate-700 shadow-slate-900/50';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getDecisionBadge = (state: string) => {
    switch (state) {
      case 'SAFE_TO_AUTOMATE':
        return { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: CheckCircle2, text: '🟢 SAFE TO AUTOMATE' };
      case 'HIGH_RISK_ESCALATION':
        return { bg: 'bg-red-500/15 border-red-500/40 text-red-400', icon: AlertTriangle, text: '🔴 HIGH-RISK ESCALATION' };
      case 'NEEDS_VERIFICATION':
        return { bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400', icon: AlertCircle, text: '🟡 HUMAN VERIFICATION REQUIRED' };
      case 'UNKNOWN':
        return { bg: 'bg-slate-800 border-slate-700 text-slate-300', icon: HelpCircleIcon, text: '⚪ CONTENT NOT OBSERVABLE' };
      default:
        return { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', icon: XCircle, text: 'SYSTEM ERROR' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Model Not Installed Warning Banner */}
      {modelStatus && !modelStatus.installed && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">BIOMEDICAL VISION MODEL NOT INSTALLED</h4>
              <p className="text-xs text-amber-400/80">
                Live vision pipeline requires a trained YOLO model (best.pt / best.onnx).
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallDefaultModel}
            disabled={installingModel}
            className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors flex items-center space-x-2"
          >
            {installingModel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>{installingModel ? 'Installing Model...' : 'Install Trained Model'}</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left Camera Stream / Capture, Right Analysis & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera View (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold tracking-wide text-white">LIVE WASTE CAMERA FEED</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">FPS: 30 • 1080p</span>
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              
              {!isCameraActive && (
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Camera Feed Idle</p>
                    <p className="text-xs text-slate-500">Allow camera access to scan biomedical waste</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
                  >
                    OPEN CAMERA
                  </button>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : 'block'}`}
              />

              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Bounding Box Visual Overlay if Analysis Result present */}
              {analysisResult && analysisResult.object && analysisResult.object.bbox && (
                <div
                  className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none rounded-sm transition-all"
                  style={{
                    left: `${(analysisResult.object.bbox.x / 640) * 100}%`,
                    top: `${(analysisResult.object.bbox.y / 480) * 100}%`,
                    width: `${(analysisResult.object.bbox.width / 640) * 100}%`,
                    height: `${(analysisResult.object.bbox.height / 480) * 100}%`
                  }}
                >
                  <div className="absolute -top-7 left-0 bg-cyan-400 text-slate-950 px-2 py-0.5 text-[11px] font-mono font-bold rounded-t shadow">
                    {analysisResult.object.class_name} ({Math.round(analysisResult.object.confidence * 100)}%)
                  </div>
                </div>
              )}
            </div>

            {/* Camera Actions & Controls */}
            {isCameraActive && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={captureAndAnalyze}
                  disabled={analyzing}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center justify-center space-x-2"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>RUNNING VISION INFERENCE...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>SCAN WASTE</span>
                    </>
                  )}
                </button>

                <button
                  onClick={stopCamera}
                  className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  CLOSE CAMERA
                </button>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {cameraError}
              </p>
            )}
          </div>

          {/* Optional Multi-Sensor Evidence Input Panel */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Multi-Sensor Context (Optional)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Department</label>
                <select
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ICU">ICU</option>
                  <option value="SURGERY">Surgery</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="ONCOLOGY">Oncology</option>
                  <option value="LAB">Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Weight (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={weightInput}
                  onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Barcode / QR</label>
                <input
                  type="text"
                  placeholder="e.g. WHITE-01"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={isOpaqueBag}
                    onChange={(e) => setIsOpaqueBag(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-[11px] font-semibold">Opaque Container</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis, Category, Hazard Gate & Decision (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {analysisResult ? (
            <div className="space-y-4">
              
              {/* Primary Decision Banner */}
              {(() => {
                const badge = getDecisionBadge(analysisResult.decision.state);
                const BadgeIcon = badge.icon;
                return (
                  <div className={`p-4 rounded-2xl border ${badge.bg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-widest">OPERATIONAL DECISION</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/40 border border-current">
                        {analysisResult.decision.state}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <BadgeIcon className="w-7 h-7 flex-shrink-0" />
                      <h3 className="text-lg font-black tracking-tight">{badge.text}</h3>
                    </div>

                    <p className="text-xs leading-relaxed font-medium opacity-90">
                      {analysisResult.decision.reason}
                    </p>
                  </div>
                );
              })()}

              {/* Object & Bin Recommendation Card */}
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">DETECTED OBJECT</p>
                    <h3 className="text-xl font-black text-white tracking-wide mt-0.5">
                      {analysisResult.object.class_name.replace('_', ' ')}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">CONFIDENCE</p>
                    <p className="text-lg font-mono font-bold text-cyan-400">
                      {Math.round(analysisResult.object.confidence * 100)}%
                    </p>
                  </div>
                </div>

                {/* Recommended Bin */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">RECOMMENDED BIN</p>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-black tracking-wider shadow-md ${getBinBadgeClass(analysisResult.category.bin_color)}`}>
                      <div className="w-3 h-3 rounded-full border border-current bg-current" />
                      <span>{analysisResult.category.bin_color} BIN</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">HAZARD LEVEL</p>
                    <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      analysisResult.hazard.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{analysisResult.hazard.severity}</span>
                    </div>
                  </div>
                </div>

                {/* Category Stream Name */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 font-medium">Biomedical Stream:</span>
                  <p className="font-bold text-slate-200">{analysisResult.category.name}</p>
                </div>
              </div>

              {/* Explainable AI: WHY THIS DECISION? */}
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                  <Info className="w-4 h-4" />
                  <span>WHY THIS DECISION?</span>
                </h4>
                <div className="space-y-2">
                  {analysisResult.decision.why_checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      {item.status === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-200">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counterfactual: WHAT WOULD MAKE THIS SAFE? */}
              {analysisResult.decision.what_safe_checklist.length > 0 && (
                <div className="glass-card rounded-2xl p-4 space-y-3 border-amber-500/20">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <Lock className="w-4 h-4" />
                    <span>WHAT WOULD MAKE THIS SAFE?</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysisResult.decision.what_safe_checklist.map((step, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Waste Registration CTA */}
              {!registeredPassport ? (
                <button
                  onClick={handleRegisterWaste}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center space-x-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>REGISTER WASTE & GENERATE QR PASSPORT</span>
                </button>
              ) : (
                <div className="glass-panel p-4 rounded-2xl border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>✓ DIGITAL WASTE PASSPORT CREATED</span>
                    <span className="font-mono">{registeredPassport.waste_id}</span>
                  </div>
                  <div className="flex items-center space-x-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    {registeredPassport.qr_code_base64 && (
                      <img src={registeredPassport.qr_code_base64} alt="QR Code" className="w-20 h-20 rounded bg-white p-1" />
                    )}
                    <div className="text-xs space-y-1">
                      <p className="font-mono font-bold text-white">{registeredPassport.passport_id}</p>
                      <p className="text-slate-400">Stream: <span className="text-cyan-400 font-bold">{registeredPassport.category}</span></p>
                      <p className="text-slate-400">Ward: <span className="text-slate-200">{registeredPassport.department}</span></p>
                      <span className="inline-block px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-mono">
                        {registeredPassport.current_status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <ShieldCheck className="w-8 h-8 text-cyan-500/50" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-300">AWAITING CAMERA INFERENCE</h3>
                <p className="text-xs text-slate-500">
                  Open camera feed and click "SCAN WASTE" to run real computer vision detection.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

function HelpCircleIcon(props: any) {
  return <Info {...props} />;
}
