import React, { useState } from 'react';
import { CreditProfile } from '../types';
import { simulateCreditScoreDelta, formatCurrency, formatPercent } from '../utils/financialCalculations';
import { 
  Gauge, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Layers, 
  Search, 
  CreditCard,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface CreditScoreAnalyzerProps {
  creditProfile: CreditProfile;
  setCreditProfile: React.Dispatch<React.SetStateAction<CreditProfile>>;
  onSyncScoreToLoan: (score: number) => void;
}

export const CreditScoreAnalyzer: React.FC<CreditScoreAnalyzerProps> = ({
  creditProfile,
  setCreditProfile,
  onSyncScoreToLoan,
}) => {
  // Simulator state
  const [paydownAmount, setPaydownAmount] = useState<number>(1500);
  const [increaseLimitAmount, setIncreaseLimitAmount] = useState<number>(3000);
  const [simulateLatePayment, setSimulateLatePayment] = useState<boolean>(false);
  const [simulateCloseOldestCard, setSimulateCloseOldestCard] = useState<boolean>(false);
  const [simulateNewInquiry, setSimulateNewInquiry] = useState<boolean>(false);

  // AI Roadmap state
  const [aiRoadmap, setAiRoadmap] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Current utilization
  const currentUtilPct = Math.round((creditProfile.currentBalance / creditProfile.totalCreditLimit) * 100);

  // Calculate simulation result
  const simulation = simulateCreditScoreDelta(creditProfile.creditScore, {
    paydownAmount,
    currentBalance: creditProfile.currentBalance,
    creditLimit: creditProfile.totalCreditLimit,
    increaseLimitAmount,
    simulateLatePayment,
    simulateCloseOldestCard,
    simulateNewInquiry,
  });

  // Credit tier categorization
  const getScoreTier = (score: number) => {
    if (score >= 800) return { label: 'Exceptional (Prime+)', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 740) return { label: 'Very Good (Prime)', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
    if (score >= 670) return { label: 'Good (Standard)', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
    if (score >= 580) return { label: 'Fair (Sub-Prime)', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { label: 'Poor (Critical)', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const currentTier = getScoreTier(creditProfile.creditScore);
  const simulatedTier = getScoreTier(simulation.projectedScore);

  // Call AI Credit Roadmap endpoint
  const generateRoadmap = async () => {
    setIsAiLoading(true);
    setAiRoadmap(null);
    try {
      const response = await fetch('/api/ai/credit-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditScore: creditProfile.creditScore,
          paymentHistoryPct: creditProfile.paymentHistoryPct,
          utilizationPct: currentUtilPct,
          creditAgeYears: creditProfile.creditAgeYears,
          totalAccounts: creditProfile.totalAccounts,
          recentInquiries: creditProfile.recentInquiries,
        }),
      });
      const data = await response.json();
      if (data.success && data.roadmap) {
        setAiRoadmap(data.roadmap);
      } else {
        setAiRoadmap('Could not generate roadmap at this moment.');
      }
    } catch (e) {
      console.error(e);
      setAiRoadmap('Error contacting AI Credit Engine. Check connection.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // SVG Gauge calculations (semi-circle 180 degrees)
  const scorePercent = (creditProfile.creditScore - 300) / (850 - 300);
  const needleRotation = -90 + scorePercent * 180;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-400" />
              <span>Credit Score Analyzer & FICO Optimization Simulator</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Analyze the 5 core underwriting pillars, test real-time credit scenarios, and generate an AI-backed repair roadmap.
            </p>
          </div>

          <button
            onClick={() => onSyncScoreToLoan(creditProfile.creditScore)}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Apply Score to Loan Checker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Grid: Gauge & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Semi-Circular Score Gauge Card */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Active FICO / Vantage Profile
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentTier.bg} ${currentTier.color} border ${currentTier.border}`}>
              {currentTier.label}
            </span>
          </div>

          {/* Semi-circular Speedometer Gauge */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-64 h-36 flex items-end justify-center overflow-hidden">
              <svg className="w-64 h-64 transform -rotate-180" viewBox="0 0 100 100">
                {/* Background arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="10"
                  strokeDasharray="125.6 125.6"
                  strokeDashoffset="0"
                />
                {/* Colored gradient arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  strokeDasharray="125.6 125.6"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="25%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="75%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Needle */}
              <div 
                className="absolute bottom-2 w-1.5 h-24 bg-white rounded-full origin-bottom shadow-lg transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${needleRotation}deg)` }}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 -ml-0.75 -mt-0.75 shadow-md"></div>
              </div>
            </div>

            {/* Score Center Value */}
            <div className="text-center mt-2">
              <span className="text-5xl font-black font-mono tracking-tight text-white">
                {creditProfile.creditScore}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Score Range: 300 to 850
              </span>
            </div>
          </div>

          {/* Quick Score Adjustment Slider */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Fine-Tune Credit Score:</span>
              <span className="font-mono text-emerald-400 font-bold">{creditProfile.creditScore}</span>
            </div>
            <input
              type="range"
              min={300}
              max={850}
              step={1}
              value={creditProfile.creditScore}
              onChange={(e) => setCreditProfile({ ...creditProfile, creditScore: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>300 (Poor)</span>
              <span>580 (Fair)</span>
              <span>670 (Good)</span>
              <span>740 (V.Good)</span>
              <span>850</span>
            </div>
          </div>
        </div>

        {/* Right: 5 Core Credit Factors Breakdown */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>5 FICO Underwriting Weightings & Factors</span>
            </h3>
            <span className="text-xs text-slate-400">Institutional Impact</span>
          </div>

          <div className="space-y-4">
            {/* 1. Payment History (35%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-200">1. Payment History</span>
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    35% Weight
                  </span>
                </div>
                <span className="font-mono text-white font-semibold">{creditProfile.paymentHistoryPct}% On-Time</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${creditProfile.paymentHistoryPct >= 99 ? 'bg-emerald-500' : creditProfile.paymentHistoryPct >= 95 ? 'bg-cyan-500' : 'bg-rose-500'}`}
                  style={{ width: `${creditProfile.paymentHistoryPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Zero 30+ day delinquencies in the past 24 months creates maximum positive point momentum.
              </p>
            </div>

            {/* 2. Credit Utilization (30%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium text-slate-200">2. Credit Utilization Ratio</span>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                    30% Weight
                  </span>
                </div>
                <span className={`font-mono font-semibold ${currentUtilPct <= 10 ? 'text-emerald-400' : currentUtilPct <= 30 ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {currentUtilPct}% ({formatCurrency(creditProfile.currentBalance)} / {formatCurrency(creditProfile.totalCreditLimit)})
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${currentUtilPct <= 10 ? 'bg-emerald-500' : currentUtilPct <= 30 ? 'bg-cyan-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, currentUtilPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Optimal: &lt;10% for prime rates</span>
                <span>Threshold: Keep under 30%</span>
              </div>
            </div>

            {/* 3. Length of Credit History (15%) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-medium text-slate-200">3. Length of Credit History</span>
                  <span className="text-[10px] font-mono text-teal-400/80 bg-teal-500/10 px-1.5 py-0.2 rounded">
                    15% Weight
                  </span>
                </div>
                <span className="font-mono text-white font-semibold">{creditProfile.creditAgeYears} Years Avg Age</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${Math.min(100, (creditProfile.creditAgeYears / 10) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Older accounts boost institutional credibility; avoid closing old zero-balance cards.
              </p>
            </div>

            {/* 4 & 5. Credit Mix (10%) & Inquiries (10%) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">4. Credit Mix (10%)</span>
                  <span className="font-mono text-cyan-400 font-semibold">{creditProfile.totalAccounts} Accounts</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Healthy mix of revolving credit cards and installment loans.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">5. Inquiries (10%)</span>
                  <span className={`font-mono font-semibold ${creditProfile.recentInquiries <= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {creditProfile.recentInquiries} Inquiries (12m)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {creditProfile.recentInquiries <= 2 ? 'Minimal hard inquiry drag' : 'High hard credit pulls; let them age 12m+'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive "What-If" Credit Score Simulator */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Interactive Credit Score Simulator (What-If Analysis)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate the mathematical impact of debt paydowns, credit limit increases, or missed payments before taking action.
            </p>
          </div>

          {/* Simulated Score Outcome Banner */}
          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/[0.08]">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Simulated Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-white">
                  {simulation.projectedScore}
                </span>
                <span className={`text-xs font-mono font-bold flex items-center ${simulation.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulation.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                  {simulation.delta >= 0 ? `+${simulation.delta}` : `${simulation.delta}`} pts
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setCreditProfile((prev) => ({ ...prev, creditScore: simulation.projectedScore }));
                onSyncScoreToLoan(simulation.projectedScore);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
            >
              Apply Simulated Score
            </button>
          </div>
        </div>

        {/* Simulator Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pay Down Balance Slider */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Pay Down Credit Card Balance:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {formatCurrency(paydownAmount)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={creditProfile.currentBalance}
              step={100}
              value={paydownAmount}
              onChange={(e) => setPaydownAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>$0</span>
              <span>New Utilization: {simulation.newUtilizationPct}%</span>
              <span>Full Payoff ({formatCurrency(creditProfile.currentBalance)})</span>
            </div>
          </div>

          {/* Increase Credit Limit Slider */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Request Credit Limit Increase (Soft Pull):</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                +{formatCurrency(increaseLimitAmount)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={increaseLimitAmount}
              onChange={(e) => setIncreaseLimitAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>$0</span>
              <span>+$5,000</span>
              <span>+$15,000</span>
            </div>
          </div>
        </div>

        {/* Toggleable Stress Events */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={simulateLatePayment}
              onChange={(e) => setSimulateLatePayment(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500/20"
            />
            <div>
              <span className="text-xs font-medium text-slate-200 block">Simulate 30-Day Late Payment</span>
              <span className="text-[11px] text-rose-400 block mt-0.5">-55 to -75 points penalty</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={simulateCloseOldestCard}
              onChange={(e) => setSimulateCloseOldestCard(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
            />
            <div>
              <span className="text-xs font-medium text-slate-200 block">Close Oldest Credit Card</span>
              <span className="text-[11px] text-amber-400 block mt-0.5">-18 points (loss of history)</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={simulateNewInquiry}
              onChange={(e) => setSimulateNewInquiry(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
            />
            <div>
              <span className="text-xs font-medium text-slate-200 block">Apply for New Credit Card</span>
              <span className="text-[11px] text-cyan-400 block mt-0.5">-7 points (hard inquiry dip)</span>
            </div>
          </label>
        </div>

        {/* Simulator Rationale Insights */}
        {simulation.insights.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1.5 text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Mathematical Simulation Insights:</span>
            </span>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              {simulation.insights.map((ins, idx) => (
                <li key={idx}>{ins}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI 30-60-90 Day Repair Roadmap Section */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step Credit Repair & Optimization Roadmap</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate a personalized 30, 60, and 90-day action plan powered by Gemini 3.8 Flash.
            </p>
          </div>

          <button
            onClick={generateRoadmap}
            disabled={isAiLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiLoading ? 'Synthesizing Tactical Roadmap...' : 'Generate AI Roadmap'}</span>
          </button>
        </div>

        {aiRoadmap ? (
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans space-y-3 pt-2">
            {aiRoadmap}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 space-y-2">
            <p>Click "Generate AI Roadmap" above to analyze your exact credit factors and receive a customized 30-60-90 day repair strategy.</p>
          </div>
        )}
      </div>
    </div>
  );
};
