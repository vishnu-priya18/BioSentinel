import React, { useEffect, useState } from 'react';
import { Camera, LayoutDashboard, ShieldCheck, QrCode, Truck, Database, Activity, Settings, Cpu, Radio, BarChart2, Cloud, HardDrive } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const [mStatus, hStatus] = await Promise.all([
        api.getModelStatus(),
        api.getSystemHealth()
      ]);
      setModelStatus(mStatus);
      setHealthStatus(hStatus);
    } catch (e) {
      console.error('Failed to fetch navbar status', e);
    }
  };

  const navItems = [
    { id: 'scan', label: 'SCAN WASTE', icon: Camera, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'passport', label: 'Waste Passport', icon: QrCode },
    { id: 'collection', label: 'Collection', icon: Truck },
    { id: 'bins', label: 'Smart Bins', icon: Database },
    { id: 'audit', label: 'Audit Chain', icon: Cpu },
    { id: 'training', label: 'AI Model', icon: BarChart2 },
    { id: 'rover', label: 'Rover AMR', icon: Radio },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('scan')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider text-white">BIO SENTINEL-X</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v1.0 OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">SEE THE WASTE • VERIFY THE RISK • CONTROL THE FLOW</p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center space-x-3">
            
            {/* Cloud Connectivity Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
              {healthStatus?.cloud_connected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">CLOUD CONNECTED</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-semibold">CLOUD NOT CONFIGURED (DEV/LOCAL)</span>
                </>
              )}
            </div>

            {/* Vision Model Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
              <div className={`w-2 h-2 rounded-full ${modelStatus?.installed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">Vision Model:</span>
              <span className={`font-semibold ${modelStatus?.installed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {modelStatus?.installed ? 'ONLINE (YOLOv8)' : 'NOT INSTALLED'}
              </span>
            </div>

          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                        : 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : item.highlight
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
