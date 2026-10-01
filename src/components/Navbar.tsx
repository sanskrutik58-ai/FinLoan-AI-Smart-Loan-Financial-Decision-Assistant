import React from 'react';
import { 
  ShieldCheck, 
  Gauge, 
  Calculator, 
  Sparkles, 
  FileSpreadsheet, 
  Building2,
  Download,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'eligibility' | 'credit' | 'emi' | 'tips' | 'sheets';
  setActiveTab: (tab: 'eligibility' | 'credit' | 'emi' | 'tips' | 'sheets') => void;
  savedCount: number;
  onReset: () => void;
  onQuickExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  onReset,
  onQuickExport,
}) => {
  interface NavItem {
    id: 'eligibility' | 'credit' | 'emi' | 'tips' | 'sheets';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
  }

  const navItems: NavItem[] = [
    { id: 'eligibility', label: 'Loan Eligibility', icon: ShieldCheck },
    { id: 'credit', label: 'Credit Score Analyzer', icon: Gauge },
    { id: 'emi', label: 'EMI Calculator', icon: Calculator },
    { id: 'tips', label: 'AI Financial Tips', icon: Sparkles },
    { 
      id: 'sheets', 
      label: 'Sheets Vault & History', 
      icon: FileSpreadsheet,
      badge: savedCount > 0 ? savedCount : null,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090D16]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-white">
                  AI Loan Eligibility
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  BFSI Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Intelligent Retail Underwriting & Financial Decisioning
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className="ml-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onQuickExport}
              title="Quick export all saved evaluations to Google Sheets format"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Sheets CSV</span>
            </button>
            <button
              onClick={onReset}
              title="Reset inputs to defaults"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] rounded-lg transition-colors border border-transparent hover:border-white/[0.06]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 gap-1 border-t border-white/[0.05] bg-slate-950/60 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== null && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
