import React, { useState } from 'react';
import { 
  LoanApplication, 
  EligibilityResult, 
  LoanType, 
  EmploymentType, 
  SavedAssessment 
} from '../types';
import { 
  formatCurrency, 
  formatPercent, 
  evaluateLoanEligibility 
} from '../utils/financialCalculations';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  Save, 
  ArrowRight, 
  Users, 
  Briefcase, 
  DollarSign, 
  FileSpreadsheet, 
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LoanEligibilityCheckerProps {
  application: LoanApplication;
  setApplication: React.Dispatch<React.SetStateAction<LoanApplication>>;
  onSaveAssessment: (assessment: SavedAssessment) => void;
  onNavigateToEMI: (amount: number, rate: number, tenureYears: number) => void;
  onNavigateToCredit: (score: number) => void;
}

export const LoanEligibilityChecker: React.FC<LoanEligibilityCheckerProps> = ({
  application,
  setApplication,
  onSaveAssessment,
  onNavigateToEMI,
  onNavigateToCredit,
}) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Evaluate loan eligibility in real-time
  const result: EligibilityResult = evaluateLoanEligibility(application);

  // Presets
  const presets = [
    {
      title: 'First-Time Homebuyer',
      desc: 'Home Mortgage · $450k',
      data: {
        loanType: 'Home Mortgage' as LoanType,
        monthlyIncome: 9500,
        existingDebts: 650,
        requestedAmount: 420000,
        tenureYears: 30,
        employmentType: 'Salaried (Corporate / MNC)' as EmploymentType,
        creditScore: 760,
        hasCoApplicant: false,
        coApplicantIncome: 0,
        coApplicantDebts: 0,
      },
    },
    {
      title: 'Auto Loan',
      desc: 'Vehicle · $38k',
      data: {
        loanType: 'Auto / Vehicle Loan' as LoanType,
        monthlyIncome: 6200,
        existingDebts: 400,
        requestedAmount: 38000,
        tenureYears: 5,
        employmentType: 'Salaried (Corporate / MNC)' as EmploymentType,
        creditScore: 715,
        hasCoApplicant: false,
        coApplicantIncome: 0,
        coApplicantDebts: 0,
      },
    },
    {
      title: 'Debt Consolidation',
      desc: 'Personal · $25k',
      data: {
        loanType: 'Personal Loan' as LoanType,
        monthlyIncome: 4800,
        existingDebts: 1650,
        requestedAmount: 25000,
        tenureYears: 4,
        employmentType: 'Salaried (Corporate / MNC)' as EmploymentType,
        creditScore: 655,
        hasCoApplicant: false,
        coApplicantIncome: 0,
        coApplicantDebts: 0,
      },
    },
    {
      title: 'Business Expansion',
      desc: 'Commercial · $150k',
      data: {
        loanType: 'Business Expansion' as LoanType,
        monthlyIncome: 16500,
        existingDebts: 2100,
        requestedAmount: 150000,
        tenureYears: 7,
        employmentType: 'Business Owner' as EmploymentType,
        creditScore: 785,
        hasCoApplicant: true,
        coApplicantIncome: 5000,
        coApplicantDebts: 600,
      },
    },
  ];

  const applyPreset = (presetData: Partial<LoanApplication>) => {
    setApplication((prev) => ({
      ...prev,
      ...presetData,
    }));
    setAiReport(null);
  };

  // AI Underwriting Report generator
  const generateAIReport = async () => {
    setIsAiLoading(true);
    setAiReport(null);
    try {
      const response = await fetch('/api/ai/loan-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: application.fullName,
          monthlyIncome: application.monthlyIncome,
          existingDebts: application.existingDebts,
          loanType: application.loanType,
          requestedAmount: application.requestedAmount,
          tenureYears: application.tenureYears,
          employmentType: application.employmentType,
          creditScore: application.creditScore,
          dtiRatio: result.dtiRatio,
          foirRatio: result.dtiRatio,
          approvalOdds: result.approvalOdds,
          estimatedEmi: result.estimatedEmi,
          maxEligibleAmount: result.maxEligibleAmount,
        }),
      });
      const data = await response.json();
      if (data.success && data.analysis) {
        setAiReport(data.analysis);
      } else {
        setAiReport('Failed to generate report. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setAiReport('Error connecting to AI underwriting engine. Falling back to algorithmic analysis.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveAssessment = () => {
    const newRecord: SavedAssessment = {
      id: `LN-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      fullName: application.fullName || 'Anonymous Applicant',
      email: application.email || 'applicant@bfsi-client.com',
      loanType: application.loanType,
      requestedAmount: application.requestedAmount,
      monthlyIncome: application.monthlyIncome,
      creditScore: application.creditScore,
      dtiRatio: result.dtiRatio,
      approvalOdds: result.approvalOdds,
      status: result.status,
      estimatedEmi: result.estimatedEmi,
      maxEligibleAmount: result.maxEligibleAmount,
      syncedToGoogleSheet: true,
    };

    onSaveAssessment(newRecord);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Odds Color & Visual Gauge
  const getOddsColor = (odds: number) => {
    if (odds >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (odds >= 65) return 'text-cyan-400 stroke-cyan-500';
    if (odds >= 45) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (result.approvalOdds / 100) * circumference;

  return (
    <div className="space-y-8">
      {/* Top Banner & Presets */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Loan Eligibility & Underwriting Assessment</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Real-Time FOIR & DTI Engine
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Evaluate borrowing capacity, debt-to-income tolerance, and institutional approval odds using retail banking benchmarks.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(p.data)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs on Left, Real-Time Decisioning on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Financial & Application Parameters</span>
              </h3>
              <span className="text-xs text-slate-400">All fields update dynamically</span>
            </div>

            {/* Applicant Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Applicant Full Name
                </label>
                <input
                  type="text"
                  value={application.fullName}
                  onChange={(e) => setApplication({ ...application, fullName: e.target.value })}
                  placeholder="e.g. Alexander Vance"
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email (for Google Sheets Report)
                </label>
                <input
                  type="email"
                  value={application.email}
                  onChange={(e) => setApplication({ ...application, email: e.target.value })}
                  placeholder="e.g. alex.vance@example.com"
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Loan Type & Employment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Loan Category
                </label>
                <select
                  value={application.loanType}
                  onChange={(e) => setApplication({ ...application, loanType: e.target.value as LoanType })}
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Home Mortgage">Home Mortgage (Real Estate)</option>
                  <option value="Personal Loan">Personal Loan (Unsecured)</option>
                  <option value="Auto / Vehicle Loan">Auto / Vehicle Loan</option>
                  <option value="Business Expansion">Business Expansion / Commercial</option>
                  <option value="Education Loan">Education / Student Loan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Employment Status
                </label>
                <select
                  value={application.employmentType}
                  onChange={(e) => setApplication({ ...application, employmentType: e.target.value as EmploymentType })}
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Salaried (Corporate / MNC)">Salaried (Corporate / MNC)</option>
                  <option value="Salaried (Government / Public)">Salaried (Government / Public)</option>
                  <option value="Self-Employed Professional">Self-Employed Professional</option>
                  <option value="Business Owner">Business Owner / Entrepreneur</option>
                  <option value="Freelancer / Gig Economy">Freelancer / Gig Economy</option>
                </select>
              </div>
            </div>

            {/* Monthly Gross Income */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Monthly Gross Income</span>
                <span className="font-mono text-emerald-400 font-semibold text-sm">
                  {formatCurrency(application.monthlyIncome)}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={40000}
                step={250}
                value={application.monthlyIncome}
                onChange={(e) => setApplication({ ...application, monthlyIncome: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>$1,000</span>
                <span>$15,000</span>
                <span>$40,000+</span>
              </div>
            </div>

            {/* Existing Monthly Debt / EMIs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-300">Existing Monthly Debts & EMIs</span>
                  <span className="text-[11px] text-slate-400">(Credit cards, auto loans, mortgages)</span>
                </div>
                <span className="font-mono text-amber-400 font-semibold text-sm">
                  {formatCurrency(application.existingDebts)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15000}
                step={50}
                value={application.existingDebts}
                onChange={(e) => setApplication({ ...application, existingDebts: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>$0 (Debt-Free)</span>
                <span>$5,000</span>
                <span>$15,000</span>
              </div>
            </div>

            {/* Requested Loan Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Requested Loan Principal</span>
                <span className="font-mono text-cyan-400 font-semibold text-sm">
                  {formatCurrency(application.requestedAmount)}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={1200000}
                step={5000}
                value={application.requestedAmount}
                onChange={(e) => setApplication({ ...application, requestedAmount: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>$5,000</span>
                <span>$500,000</span>
                <span>$1,200,000</span>
              </div>
            </div>

            {/* Tenure & Credit Score Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">Loan Tenure</span>
                  <span className="font-mono text-white font-semibold">
                    {application.tenureYears} Years ({application.tenureYears * 12} Mos)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={application.tenureYears}
                  onChange={(e) => setApplication({ ...application, tenureYears: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>1 Yr</span>
                  <span>15 Yrs</span>
                  <span>30 Yrs</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">Credit Score (FICO)</span>
                  <button 
                    onClick={() => onNavigateToCredit(application.creditScore)}
                    className="font-mono text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>{application.creditScore}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="range"
                  min={300}
                  max={850}
                  step={5}
                  value={application.creditScore}
                  onChange={(e) => setApplication({ ...application, creditScore: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>300 (Poor)</span>
                  <span>670 (Good)</span>
                  <span>850 (Exceptional)</span>
                </div>
              </div>
            </div>

            {/* Co-Applicant & Advanced Toggle */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Co-Applicant & Down Payment Options (Boost Approval)</span>
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={application.hasCoApplicant}
                        onChange={(e) => setApplication({ ...application, hasCoApplicant: e.target.checked })}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span>Add Co-Applicant (Combines household income to increase loan limit)</span>
                    </label>
                  </div>

                  {application.hasCoApplicant && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Co-Applicant Monthly Income ($)
                        </label>
                        <input
                          type="number"
                          value={application.coApplicantIncome}
                          onChange={(e) => setApplication({ ...application, coApplicantIncome: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Co-Applicant Existing Debts ($)
                        </label>
                        <input
                          type="number"
                          value={application.coApplicantDebts}
                          onChange={(e) => setApplication({ ...application, coApplicantDebts: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Down Payment / Asset Equity ($)
                      </label>
                      <input
                        type="number"
                        value={application.downPayment}
                        onChange={(e) => setApplication({ ...application, downPayment: Number(e.target.value) })}
                        placeholder="e.g. 50000"
                        className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Total Asset / Property Value ($)
                      </label>
                      <input
                        type="number"
                        value={application.propertyValue}
                        onChange={(e) => setApplication({ ...application, propertyValue: Number(e.target.value) })}
                        placeholder="e.g. 500000"
                        className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Underwriter Decisioning & Visual Gauge */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Decision Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                  Automated Credit Decision
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {result.status}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Risk Grade</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {result.riskGrade}
                </div>
              </div>
            </div>

            {/* Circular Gauge & Core Odds */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Active Animated Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    className={`${getOddsColor(result.approvalOdds)} transition-all duration-700 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs uppercase font-medium text-slate-400">
                    Approval Odds
                  </span>
                  <span className="text-4xl font-extrabold tracking-tight text-white font-mono my-0.5">
                    {result.approvalOdds}%
                  </span>
                  <span className="text-[11px] text-emerald-400/90 font-medium">
                    {result.approvalOdds >= 75 ? 'Prime Approval' : result.approvalOdds >= 50 ? 'Moderate Odds' : 'Restructure Needed'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Core Financial Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">Est. Monthly EMI</span>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {formatCurrency(result.estimatedEmi)}
                  <span className="text-[10px] text-slate-500 font-normal"> /mo</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  @ {result.interestRateBand.selectedRate}% APR
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">Max Borrowing Capacity</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatCurrency(result.maxEligibleAmount)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {application.requestedAmount <= result.maxEligibleAmount ? '✓ Within Limit' : '⚠ Exceeds Capacity'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">DTI / FOIR Ratio</span>
                <span className={`text-base font-bold font-mono ${result.dtiRatio <= 43 ? 'text-emerald-400' : result.dtiRatio <= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {formatPercent(result.dtiRatio)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Bank Max: 50%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block">Indicative APR Band</span>
                <span className="text-base font-bold font-mono text-white">
                  {result.interestRateBand.minRate}% - {result.interestRateBand.maxRate}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Based on {application.creditScore} FICO
                </span>
              </div>
            </div>

            {/* Factor Checklist */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Underwriting Checks
              </span>
              {result.keyFactors.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  {f.status === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : f.status === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-medium text-slate-200">{f.label}: </span>
                    <span className="text-slate-400">{f.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions Box */}
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Underwriter Advice:</span>
              </div>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={generateAIReport}
                disabled={isAiLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isAiLoading ? 'Synthesizing BFSI Underwriting Memorandum...' : 'Generate AI Underwriting Report'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveAssessment}
                  className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{saveSuccess ? 'Saved to Vault ✓' : 'Save to Sheets Vault'}</span>
                </button>

                <button
                  onClick={() => onNavigateToEMI(application.requestedAmount, result.interestRateBand.selectedRate, application.tenureYears)}
                  className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Amortization</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Underwriter Memorandum Output Panel (When generated) */}
      {aiReport && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  AI Retail Credit Underwriter Memorandum
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive risk assessment generated by Gemini 3.8 Flash
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiReport(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-white/[0.05]"
            >
              Close
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
};
