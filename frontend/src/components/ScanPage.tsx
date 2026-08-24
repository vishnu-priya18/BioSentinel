import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, AlertCircle, PackageCheck, Zap, Info, Upload, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import type { WasteAnalysisResponse, WastePassport } from '../types';

// Pre-rendered high-quality test image Data URIs for judges to test 1-click golden path
const DEMO_PRESET_IMAGES: Record<string, { name: string; type: string; dataUrl: string }> = {
  syringe: {
    name: "Syringe Sample (Critical Sharp)",
    type: "syringe",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'><rect width='100%' height='100%' fill='%230f172a'/><g transform='translate(120, 140)'><rect x='100' y='80' width='220' height='40' fill='%23cbd5e1' rx='5' stroke='%2394a3b8' stroke-width='3'/><rect x='320' y='90' width='80' height='20' fill='%230284c7'/><polygon points='400,98 470,100 400,102' fill='%23e2e8f0'/><rect x='60' y='70' width='40' height='60' fill='%2364748b'/><line x1='0' y1='100' x2='60' y2='100' stroke='%2394a3b8' stroke-width='8'/><line x1='140' y1='80' x2='140' y2='120' stroke='%23475569' stroke-width='3'/><line x1='180' y1='80' x2='180' y2='120' stroke='%23475569' stroke-width='3'/><line x1='220' y1='80' x2='220' y2='120' stroke='%23475569' stroke-width='3'/><line x1='260' y1='80' x2='260' y2='120' stroke='%23475569' stroke-width='3'/><text x='160' y='60' fill='%2338bdf8' font-family='monospace' font-size='18' font-weight='bold'>STERILE SYRINGE 10mL</text></g></svg>"
  },
  gauze: {
    name: "Blood-Soaked Gauze (Infectious)",
    type: "blood_soaked_gauze",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'><rect width='100%' height='100%' fill='%230f172a'/><g transform='translate(180, 120)'><rect x='40' y='40' width='240' height='200' fill='%23f8fafc' rx='10' stroke='%23cbd5e1' stroke-width='4'/><path d='M80 70 Q140 50 180 110 T240 160 Q200 220 140 200 T70 140 Z' fill='%23dc2626' opacity='0.85'/><circle cx='130' cy='120' r='35' fill='%23991b1b'/><text x='55' y='270' fill='%23f87171' font-family='monospace' font-size='16' font-weight='bold'>BLOOD SOAKED DRESSING</text></g></svg>"
  },
  iv_tube: {
    name: "IV Tube (Plastic Stream)",
    type: "iv_tube",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'><rect width='100%' height='100%' fill='%230f172a'/><path d='M100 240 Q 250 80, 400 240 T 540 240' fill='none' stroke='%2338bdf8' stroke-width='16' stroke-linecap='round'/><rect x='480' y='210' width='40' height='60' fill='%230284c7' rx='5'/><text x='200' y='360' fill='%2338bdf8' font-family='monospace' font-size='16' font-weight='bold'>CONTAMINATED IV TUBING</text></svg>"
  },
  vial: {
    name: "Glass Vial (Glass Stream)",
    type: "glass_vial",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'><rect width='100%' height='100%' fill='%230f172a'/><g transform='translate(240, 100)'><rect x='40' y='80' width='80' height='180' fill='%2338bdf8' fill-opacity='0.25' stroke='%237dd3fc' stroke-width='4' rx='8'/><rect x='50' y='50' width='60' height='30' fill='%230284c7'/><rect x='45' y='35' width='70' height='15' fill='%2364748b'/><text x='15' y='300' fill='%237dd3fc' font-family='monospace' font-size='16' font-weight='bold'>MEDICINE VIAL</text></g></svg>"
  },
  unknown: {
    name: "Unknown Waste Item",
    type: "unknown_object",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'><rect width='100%' height='100%' fill='%230f172a'/><path d='M200 150 L440 150 L380 330 L160 330 Z' fill='%23334155' stroke='%23475569' stroke-width='4'/><text x='240' y='250' fill='%2394a3b8' font-family='monospace' font-size='48' font-weight='bold'>?</text><text x='180' y='380' fill='%2394a3b8' font-family='monospace' font-size='16' font-weight='bold'>UNCLEAR OPAQUE OBJECT</text></svg>"
  }
};

export const ScanPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<WasteAnalysisResponse | null>(null);
  const [registeredPassport, setRegisteredPassport] = useState<WastePassport | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isDemoPresetMode, setIsDemoPresetMode] = useState<boolean>(false);
  const [presetLabel, setPresetLabel] = useState<string | null>(null);

  // Sensor Evidence Fusion Inputs
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [weightInput, setWeightInput] = useState<number>(0.25);
  const [departmentInput, setDepartmentInput] = useState<string>('ICU');
  const [isOpaqueBag, setIsOpaqueBag] = useState<boolean>(false);

  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    fetchInitialStatus();
  }, []);

  const fetchInitialStatus = async () => {
    try {
      const hStatus = await api.getSystemHealth();
      setSystemHealth(hStatus);
    } catch (e) {
      console.error('Failed to fetch system health', e);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setUploadedImagePreview(null);
    setIsDemoPresetMode(false);
    setPresetLabel(null);
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
      setCameraError('Unable to access camera. Please allow permissions or select a Test Preset Image below.');
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

    await sendAnalysisRequest(base64Image);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    setIsDemoPresetMode(false);
    setPresetLabel(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadedImagePreview(base64);
      await sendAnalysisRequest(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (presetKey: string) => {
    stopCamera();
    const preset = DEMO_PRESET_IMAGES[presetKey];
    if (!preset) return;

    setIsDemoPresetMode(true);
    setPresetLabel(preset.name);
    setUploadedImagePreview(preset.dataUrl);
    await sendAnalysisRequest(preset.dataUrl);
  };

  const sendAnalysisRequest = async (base64Image: string) => {
    setAnalyzing(true);
    setRegisteredPassport(null);
    try {
      const formData = new FormData();
      formData.append('image_base64', base64Image);
      if (barcodeInput) formData.append('barcode', barcodeInput);
      if (weightInput) formData.append('weight_kg', weightInput.toString());
      if (departmentInput) formData.append('department', departmentInput);
      formData.append('is_opaque_bag', isOpaqueBag ? 'true' : 'false');

      const data = await api.analyzeImage(formData);
      setAnalysisResult(data);
    } catch (e) {
      console.error('Analysis request error', e);
    } finally {
      setAnalyzing(false);
    }
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
        return { bg: 'bg-red-500/15 border-red-500/40 text-red-400', icon: AlertTriangle, text: '🚨 CRITICAL HAZARD: AUTOMATION BLOCKED' };
      case 'NEEDS_VERIFICATION':
        return { bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400', icon: AlertCircle, text: '🟡 HUMAN VERIFICATION REQUIRED' };
      case 'UNKNOWN':
        return { bg: 'bg-slate-800 border-slate-700 text-slate-300', icon: HelpCircle, text: '⚪ MANUAL INSPECTION REQUIRED' };
      default:
        return { bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', icon: XCircle, text: 'SYSTEM ERROR' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Central Visual Invariant Banner */}
      <div className="glass-panel p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center space-x-2 justify-center md:justify-start">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white tracking-wide">CORE INNOVATION: AI PERCEPTION ≠ OPERATIONAL PERMISSION</h2>
          </div>
          <p className="text-xs text-slate-400">
            The AI identifies the waste object. The deterministic <strong className="text-cyan-300">Safety Policy Engine</strong> decides whether automation is safe. High confidence NEVER overrides safety rules.
          </p>
        </div>

        {/* Demo Mode / Cloud Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className={`px-3 py-1 rounded-lg font-bold border ${systemHealth?.cloud_connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
            {systemHealth?.cloud_connected ? '● CLOUD CONNECTED' : '○ LOCAL PERSISTENCE'}
          </span>
          {isDemoPresetMode && (
            <span className="px-3 py-1 rounded-lg font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              DEMO TEST IMAGE
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left Camera/Preview Viewport, Right AI Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera / Image Viewport & Preset Buttons (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold tracking-wide text-white">LIVE WASTE PERCEPTION FEED</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {isDemoPresetMode ? `DEMO: ${presetLabel}` : 'REAL VISION INFERENCE'}
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Viewport Container */}
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              
              {!isCameraActive && !uploadedImagePreview && (
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <Camera className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Camera Feed Idle</p>
                    <p className="text-xs text-slate-500">Upload a photo, open webcam, or select a Demo Test Image below to scan</p>
                  </div>
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>OPEN CAMERA</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-bold text-xs text-slate-200 hover:bg-slate-700 transition-all flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>UPLOAD IMAGE</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Uploaded or Demo Image Preview */}
              {uploadedImagePreview && !isCameraActive && (
                <img
                  src={uploadedImagePreview}
                  alt="Waste Item Viewport"
                  className="w-full h-full object-contain bg-slate-950"
                />
              )}

              {/* Live Webcam Feed */}
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

              {/* Bounding Box Visual Overlay if Detections Present */}
              {analysisResult && analysisResult.object && analysisResult.object.bbox && (
                <div
                  className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-none rounded-sm transition-all"
                  style={{
                    left: `${Math.max(5, Math.min(80, (analysisResult.object.bbox.x / 640) * 100))}%`,
                    top: `${Math.max(5, Math.min(80, (analysisResult.object.bbox.y / 480) * 100))}%`,
                    width: `${Math.max(20, Math.min(90, (analysisResult.object.bbox.width / 640) * 100))}%`,
                    height: `${Math.max(20, Math.min(90, (analysisResult.object.bbox.height / 480) * 100))}%`
                  }}
                >
                  <div className="absolute -top-7 left-0 bg-cyan-400 text-slate-950 px-2 py-0.5 text-[11px] font-mono font-bold rounded-t shadow flex items-center space-x-1">
                    <span>{analysisResult.object.class_name.toUpperCase()}</span>
                    <span>({Math.round(analysisResult.object.confidence * 100)}%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera / Action Controls */}
            <div className="flex items-center justify-between gap-3">
              {isCameraActive ? (
                <>
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
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="text-xs font-mono text-slate-400">
                    {isDemoPresetMode ? 'Mode: DEMO TEST IMAGE' : 'Mode: UPLOAD / CAMERA'}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Upload File</span>
                  </button>
                </div>
              )}
            </div>

              {cameraError && (
                <div className="text-xs text-red-400 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 font-mono">
                  {cameraError}
                </div>
              )}

            {/* Quick Demo Preset Test Image Buttons for Judges */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block font-bold">
                ⚡ 1-CLICK DEMO TEST IMAGES (SIH JUDGING PRESETS):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(DEMO_PRESET_IMAGES).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectPreset(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all ${
                      key === 'syringe'
                        ? 'bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Fusion Sensor Inputs */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">DEPARTMENT ORIGIN</label>
                <select
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="ICU">ICU (Intensive Care)</option>
                  <option value="SURGERY">Surgical Theater</option>
                  <option value="ONCOLOGY">Oncology Ward</option>
                  <option value="LAB">Diagnostic Lab</option>
                  <option value="EMERGENCY">Emergency Ward</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">LOAD CELL WEIGHT (KG)</label>
                <input
                  type="number"
                  step="0.05"
                  value={weightInput}
                  onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">BARCODE / TAG (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="Scan bag barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="opaqueCheck"
                checked={isOpaqueBag}
                onChange={(e) => setIsOpaqueBag(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
              />
              <label htmlFor="opaqueCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                Contents non-observable (Opaque Bag / Sealed Container)
              </label>
            </div>

          </div>
        </div>

        {/* Right Column: AI Analysis Result, Safety Policy, Passports (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {analyzing && (
            <div className="glass-panel rounded-2xl p-8 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Executing Perception & Safety Pipeline</h4>
                <p className="text-xs text-slate-400">YOLO Model $\rightarrow$ Stream Mapper $\rightarrow$ Safety Gate $\rightarrow$ Policy Engine</p>
              </div>
            </div>
          )}

          {!analysisResult && !analyzing && (
            <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-300">Awaiting Waste Item Scan</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click <strong className="text-cyan-400">Syringe Sample</strong> or <strong className="text-cyan-400">UPLOAD IMAGE</strong> to analyze medical waste.
                </p>
              </div>
            </div>
          )}

          {analysisResult && !analyzing && (
            <div className="space-y-4">
              
              {/* Decision Badge Header */}
              {(() => {
                const badge = getDecisionBadge(analysisResult.decision.state);
                const IconComp = badge.icon;
                return (
                  <div className={`p-4 rounded-2xl border ${badge.bg} flex items-center justify-between shadow-lg`}>
                    <div className="flex items-center space-x-3">
                      <IconComp className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-80">SAFETY DECISION ENGINE</h4>
                        <p className="text-sm font-black">{badge.text}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-950/80 rounded border border-slate-700">
                      {analysisResult.decision.automation_allowed ? 'AUTOPILOT' : 'BLOCKED'}
                    </span>
                  </div>
                );
              })()}

              {/* Analysis Result Card */}
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                
                {/* Detected Object & Actual Confidence */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">DETECTED OBJECT</span>
                    <h3 className="text-lg font-black text-cyan-300 uppercase tracking-wide">
                      {analysisResult.object.class_name.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">AI CONFIDENCE</span>
                    <span className="text-base font-extrabold font-mono text-cyan-400">
                      {Math.round(analysisResult.object.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Stream Category & Bin */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">BIOMEDICAL STREAM</span>
                    <span className="text-xs font-bold text-slate-200">
                      {analysisResult.category.name}
                    </span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black border shadow-lg ${getBinBadgeClass(analysisResult.category.code)}`}>
                    {analysisResult.category.code} BIN
                  </span>
                </div>

                {/* Hazard Evaluation */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">HAZARD GATE</span>
                    <span className={`text-xs font-bold ${analysisResult.hazard.is_sharp ? 'text-red-400' : 'text-slate-300'}`}>
                      {analysisResult.hazard.severity} HAZARD {analysisResult.hazard.is_sharp ? '(CRITICAL SHARP)' : ''}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold ${analysisResult.hazard.is_sharp ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                    {analysisResult.hazard.is_sharp ? 'SHARP DETECTED' : 'NON-SHARP'}
                  </span>
                </div>

                {/* Bounding Box Coordinates (Proves real computer vision output) */}
                {analysisResult.object.bbox && (
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                    <span className="text-[10px] text-cyan-400 block font-bold">MODEL BOUNDING BOX COORDINATES:</span>
                    <p className="text-slate-300">
                      x: {analysisResult.object.bbox.x}, y: {analysisResult.object.bbox.y}, w: {analysisResult.object.bbox.width}, h: {analysisResult.object.bbox.height}
                    </p>
                  </div>
                )}

                {/* Explanation Reason */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 block flex items-center space-x-1">
                    <Info className="w-3 h-3" />
                    <span>DETERMINISTIC SAFETY RULE REASONING</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysisResult.decision.reason}
                  </p>
                </div>

                {/* Register Waste & Generate Passport Button */}
                <button
                  onClick={handleRegisterWaste}
                  disabled={!!registeredPassport}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                    registeredPassport
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-lg shadow-cyan-400/20'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{registeredPassport ? 'REGISTERED IN SYSTEM' : 'REGISTER WASTE BAG & GENERATE QR PASSPORT'}</span>
                </button>

              </div>

              {/* QR Waste Passport Card if Registered */}
              {registeredPassport && (
                <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PackageCheck className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-300">DIGITAL WASTE PASSPORT GENERATED</h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      {registeredPassport.passport_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 pt-2">
                    <img
                      src={registeredPassport.qr_code_base64}
                      alt="QR Code"
                      className="w-20 h-20 rounded-lg border border-slate-700 bg-white p-1"
                    />
                    <div className="space-y-1 text-xs text-slate-300">
                      <p><strong className="text-slate-400">Waste ID:</strong> {registeredPassport.waste_id}</p>
                      <p><strong className="text-slate-400">Category:</strong> {registeredPassport.category}</p>
                      <p><strong className="text-slate-400">Department:</strong> {registeredPassport.department}</p>
                      <p><strong className="text-slate-400">Weight:</strong> {registeredPassport.weight} kg</p>
                      <p><strong className="text-slate-400">Status:</strong> {registeredPassport.current_status}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
