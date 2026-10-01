import React, { useState } from 'react';
import { 
  calculateEMI, 
  generateAmortizationSchedule, 
  formatCurrency, 
  formatPercent, 
  triggerFileDownload 
} from '../utils/financialCalculations';
import { 
  Calculator, 
  PieChart, 
  Download, 
  Copy, 
  Sparkles, 
  ArrowDownCircle, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  DollarSign, 
  Percent,
  Calendar,
  Layers
} from 'lucide-react';

interface EmiCalculatorProps {
  initialAmount?: number;
  initialRate?: number;
  initialTenureYears?: number;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({
  initialAmount = 250000,
  initialRate = 6.75,
  initialTenureYears = 20,
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(initialAmount);
  const [interestRate, setInterestRate] = useState<number>(initialRate);
  const [tenureYears, setTenureYears] = useState<number>(initialTenureYears);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [copied, setCopied] = useState<boolean>(false);

  const tenureMonths = tenureYears * 12;

  // Generate schedule and breakdown
  const { monthlySchedule, yearlySchedule, summary } = generateAmortizationSchedule(
    loanAmount,
    interestRate,
    tenureMonths,
    extraMonthlyPayment
  );

  const baseEmi = summary.monthlyPayment;
  const effectiveEmi = baseEmi + extraMonthlyPayment;
  const totalPrincipal = loanAmount;
  const totalInterest = summary.totalInterest;
  const totalPayment = summary.totalAmount;

  const principalRatio = totalPayment > 0 ? (totalPrincipal / totalPayment) * 100 : 50;
  const interestRatio = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 50;

  // Donut SVG circumference math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const principalStroke = (principalRatio / 100) * circumference;
  const interestStroke = (interestRatio / 100) * circumference;

  // Export Amortization Table to CSV
  const handleExportCSV = () => {
    const activeSchedule = viewMode === 'yearly' ? yearlySchedule : monthlySchedule;
    const headers = [
      'Period',
      'Payment ($)',
      'Principal Paid ($)',
      'Interest Paid ($)',
      'Total Interest to Date ($)',
      'Remaining Balance ($)',
      'Equity (%)',
    ];

    const rows = activeSchedule.map((r) => [
      `"${r.label}"`,
      r.payment,
      r.principal,
      r.interest,
      r.totalInterestPaid,
      r.remainingBalance,
      `${r.equityPercentage}%`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    triggerFileDownload(csvContent, `Amortization_Schedule_${viewMode}_${loanAmount}.csv`);
  };

  // Copy TSV for Google Sheets
  const handleCopyTSV = () => {
    const activeSchedule = viewMode === 'yearly' ? yearlySchedule : monthlySchedule;
    const headers = ['Period\tPayment\tPrincipal Paid\tInterest Paid\tCumulative Interest\tRemaining Balance\tEquity'];
    const rows = activeSchedule.map(
      (r) => `${r.label}\t$${r.payment.toLocaleString()}\t$${r.principal.toLocaleString()}\t$${r.interest.toLocaleString()}\t$${r.totalInterestPaid.toLocaleString()}\t$${r.remainingBalance.toLocaleString()}\t${r.equityPercentage}%`
    );
    const tsvContent = [...headers, ...rows].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span>EMI Amortization & Early Payoff Calculator</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Precision BFSI amortization schedule, interest breakdown, and prepayment acceleration analysis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleCopyTSV}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copied ? 'Copied TSV ✓' : 'Copy for Sheets'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Sliders on Left, Breakdown & Donut on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Controls */}
        <div className="lg:col-span-6 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Loan Parameters</span>
            </h3>
            <span className="text-xs text-slate-400">Interactive Sliders</span>
          </div>

          {/* Loan Principal Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Loan Principal Amount:</span>
              <span className="font-mono text-emerald-400 font-bold text-base">
                {formatCurrency(loanAmount)}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={1500000}
              step={5000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>$5,000</span>
              <span>$500,000</span>
              <span>$1,500,000+</span>
            </div>
          </div>

          {/* Annual Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Annual Interest Rate (APR):</span>
              <span className="font-mono text-cyan-400 font-bold text-base">
                {interestRate.toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min={2.5}
              max={22}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>2.5% (Prime Mortgage)</span>
              <span>10% (Personal)</span>
              <span>22% (Sub-Prime)</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Loan Tenure:</span>
              <span className="font-mono text-white font-bold text-base">
                {tenureYears} Years ({tenureMonths} Months)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>1 Year</span>
              <span>15 Years</span>
              <span>30 Years</span>
            </div>
          </div>

          {/* Prepayment Acceleration Slider */}
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-200">Extra Monthly Prepayment:</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                  Principal Reduction
                </span>
              </div>
              <span className="font-mono text-teal-400 font-bold text-sm">
                +{formatCurrency(extraMonthlyPayment)} /mo
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2500}
              step={50}
              value={extraMonthlyPayment}
              onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>$0</span>
              <span>+$500/mo</span>
              <span>+$2,500/mo</span>
            </div>
          </div>

          {/* Prepayment Benefit Callout */}
          {extraMonthlyPayment > 0 && summary.interestSaved > 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/30 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Prepayment Savings Impact:</span>
              </div>
              <p className="text-slate-200">
                By paying an extra <span className="font-bold text-white">{formatCurrency(extraMonthlyPayment)}/mo</span>, you will save{' '}
                <span className="font-bold text-emerald-400">{formatCurrency(summary.interestSaved)}</span> in interest and pay off your loan{' '}
                <span className="font-bold text-cyan-400">{Math.floor(summary.monthsSaved / 12)} years {summary.monthsSaved % 12} months</span> sooner!
              </p>
            </div>
          )}
        </div>

        {/* Right: EMI Breakdown & Donut Visualization */}
        <div className="lg:col-span-6 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Financial Summary
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Amortization Term: {tenureYears} Yrs
            </span>
          </div>

          {/* Main EMI Highlight Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Monthly Loan Payment</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-white">
                  {formatCurrency(effectiveEmi)}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              {extraMonthlyPayment > 0 && (
                <span className="text-[11px] text-teal-400 block mt-0.5">
                  Includes {formatCurrency(baseEmi)} standard EMI + {formatCurrency(extraMonthlyPayment)} prepayment
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Repayment</span>
              <span className="text-lg font-bold font-mono text-cyan-400">
                {formatCurrency(totalPayment)}
              </span>
            </div>
          </div>

          {/* Donut Chart and Legend */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Principal segment */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${principalStroke} ${circumference}`}
                  strokeDashoffset="0"
                />
                {/* Interest segment */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="12"
                  strokeDasharray={`${interestStroke} ${circumference}`}
                  strokeDashoffset={-principalStroke}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400">Total</span>
                <span className="text-xs font-bold font-mono text-white">
                  {formatCurrency(totalPayment)}
                </span>
              </div>
            </div>

            {/* Breakdown Legend Cards */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0"></div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Principal ({principalRatio.toFixed(1)}%)</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {formatCurrency(totalPrincipal)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/[0.06] flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded bg-cyan-500 shrink-0"></div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Interest ({interestRatio.toFixed(1)}%)</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">
                    {formatCurrency(totalInterest)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] text-xs">
            <div>
              <span className="text-slate-400 block">Loan Term:</span>
              <span className="font-semibold text-white">{summary.actualMonths} Total Months</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">Interest to Principal Ratio:</span>
              <span className="font-semibold font-mono text-white">
                {(totalInterest / totalPrincipal).toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Full Amortization Schedule</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Year-by-year and month-by-month principal reduction and equity accumulation.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'yearly'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly Summary
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Month-by-Month ({monthlySchedule.length})
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto max-h-96 rounded-xl border border-white/[0.06] custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10 border-b border-white/[0.06]">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Principal</th>
                <th className="py-3 px-4">Interest</th>
                <th className="py-3 px-4">Cumulative Interest</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Equity %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {(viewMode === 'yearly' ? yearlySchedule : monthlySchedule).map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-200">{row.label}</td>
                  <td className="py-2.5 px-4 text-white">{formatCurrency(row.payment)}</td>
                  <td className="py-2.5 px-4 text-emerald-400">{formatCurrency(row.principal)}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{formatCurrency(row.interest)}</td>
                  <td className="py-2.5 px-4 text-slate-400">{formatCurrency(row.totalInterestPaid)}</td>
                  <td className="py-2.5 px-4 text-white font-bold">{formatCurrency(row.remainingBalance)}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${row.equityPercentage}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-[11px]">{row.equityPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
