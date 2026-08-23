import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ScanPage } from './components/ScanPage';
import { DashboardPage } from './components/DashboardPage';
import { AnalysisPage } from './components/AnalysisPage';
import { VerificationPage } from './components/VerificationPage';
import { PassportPage } from './components/PassportPage';
import { CollectionPage } from './components/CollectionPage';
import { BinsPage } from './components/BinsPage';
import { RoverPage } from './components/RoverPage';
import { AuditPage } from './components/AuditPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { SettingsPage } from './components/SettingsPage';
import { ModelTrainingPage } from './components/ModelTrainingPage';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('scan');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'scan': return <ScanPage />;
      case 'dashboard': return <DashboardPage />;
      case 'analysis': return <AnalysisPage />;
      case 'verification': return <VerificationPage />;
      case 'passport': return <PassportPage />;
      case 'collection': return <CollectionPage />;
      case 'bins': return <BinsPage />;
      case 'rover': return <RoverPage />;
      case 'audit': return <AuditPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'training': return <ModelTrainingPage />;
      case 'settings': return <SettingsPage />;
      default: return <ScanPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 pb-12">
        {renderActivePage()}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        BIO SENTINEL-X OS v1.0 • Smart Biomedical Waste Detection & Segregation • "Prediction ≠ Permission"
      </footer>
    </div>
  );
}

export default App;
