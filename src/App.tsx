/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LoanApplication, 
  CreditProfile, 
  SavedAssessment, 
  LoanType, 
  EmploymentType 
} from './types';
import { Navbar } from './components/Navbar';
import { LoanEligibilityChecker } from './components/LoanEligibilityChecker';
import { CreditScoreAnalyzer } from './components/CreditScoreAnalyzer';
import { EmiCalculator } from './components/EmiCalculator';
import { AiFinancialTips } from './components/AiFinancialTips';
import { SheetsSyncVault } from './components/SheetsSyncVault';
import { generateGoogleSheetsCSV, triggerFileDownload } from './utils/financialCalculations';
import { Shield, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

const INITIAL_APPLICATION: LoanApplication = {
  fullName: 'Alexander Vance',
  email: 'alex.vance@prime-bfsi.com',
  phone: '+1 (555) 234-8900',
  monthlyIncome: 9500,
  existingDebts: 650,
  loanType: 'Home Mortgage',
  requestedAmount: 420000,
  tenureYears: 30,
  employmentType: 'Salaried (Corporate / MNC)',
  creditScore: 760,
  hasCoApplicant: false,
  coApplicantIncome: 0,
  coApplicantDebts: 0,
  downPayment: 60000,
  propertyValue: 480000,
};

const INITIAL_CREDIT_PROFILE: CreditProfile = {
  creditScore: 760,
  paymentHistoryPct: 99,
  totalCreditLimit: 38000,
  currentBalance: 3950,
  creditAgeYears: 7.5,
  totalAccounts: 9,
  recentInquiries: 1,
  derogatoryMarks: 0,
};

const INITIAL_SAVED_ASSESSMENTS: SavedAssessment[] = [
  {
    id: 'LN-MORT-892',
    timestamp: '2026-09-28T14:30:00.000Z',
    fullName: 'Alexander Vance',
    email: 'alex.vance@prime-bfsi.com',
    loanType: 'Home Mortgage',
    requestedAmount: 420000,
    monthlyIncome: 9500,
    creditScore: 760,
    dtiRatio: 33.4,
    approvalOdds: 92,
    status: 'Prime Approval',
    estimatedEmi: 2515,
    maxEligibleAmount: 512000,
    syncedToGoogleSheet: true,
  },
  {
    id: 'LN-AUTO-415',
    timestamp: '2026-09-29T10:15:00.000Z',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@techcorp.io',
    loanType: 'Auto / Vehicle Loan',
    requestedAmount: 38000,
    monthlyIncome: 6200,
    creditScore: 715,
    dtiRatio: 26.8,
    approvalOdds: 88,
    status: 'Prime Approval',
    estimatedEmi: 745,
    maxEligibleAmount: 64000,
    syncedToGoogleSheet: true,
  },
  {
    id: 'LN-BIZ-704',
    timestamp: '2026-09-30T16:45:00.000Z',
    fullName: 'Marcus Sterling',
    email: 'marcus@sterlingventures.co',
    loanType: 'Business Expansion',
    requestedAmount: 150000,
    monthlyIncome: 16500,
    creditScore: 785,
    dtiRatio: 28.5,
    approvalOdds: 95,
    status: 'Prime Approval',
    estimatedEmi: 2530,
    maxEligibleAmount: 240000,
    syncedToGoogleSheet: true,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'eligibility' | 'credit' | 'emi' | 'tips' | 'sheets'>('eligibility');
  const [application, setApplication] = useState<LoanApplication>(() => {
    const saved = localStorage.getItem('bfsi_loan_application');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATION;
  });

  const [creditProfile, setCreditProfile] = useState<CreditProfile>(() => {
    const saved = localStorage.getItem('bfsi_credit_profile');
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_PROFILE;
  });

  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>(() => {
    const saved = localStorage.getItem('bfsi_saved_assessments');
    return saved ? JSON.parse(saved) : INITIAL_SAVED_ASSESSMENTS;
  });

  // State to pass forward to EMI Calculator
  const [emiParameters, setEmiParameters] = useState<{
    amount: number;
    rate: number;
    tenureYears: number;
  }>({
    amount: 420000,
    rate: 6.25,
    tenureYears: 30,
  });

  // Persist application changes to localStorage
  useEffect(() => {
    localStorage.setItem('bfsi_loan_application', JSON.stringify(application));
  }, [application]);

  // Persist credit profile changes to localStorage
  useEffect(() => {
    localStorage.setItem('bfsi_credit_profile', JSON.stringify(creditProfile));
  }, [creditProfile]);

  // Persist saved assessments
  useEffect(() => {
    localStorage.setItem('bfsi_saved_assessments', JSON.stringify(savedAssessments));
  }, [savedAssessments]);

  // Save assessment handler
  const handleSaveAssessment = (assessment: SavedAssessment) => {
    setSavedAssessments((prev) => [assessment, ...prev]);

    // Optional webhook auto-sync
    const webhookUrl = localStorage.getItem('bfsi_google_sheets_webhook');
    if (webhookUrl) {
      try {
        fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assessment),
        });
      } catch (err) {
        console.warn('Webhook auto-sync encountered an error:', err);
      }
    }
  };

  // Delete assessment
  const handleDeleteAssessment = (id: string) => {
    setSavedAssessments((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all assessments
  const handleClearAllAssessments = () => {
    if (window.confirm('Are you sure you want to clear all saved loan assessments?')) {
      setSavedAssessments([]);
    }
  };

  // Load past assessment into application
  const handleLoadAssessment = (record: SavedAssessment) => {
    setApplication((prev) => ({
      ...prev,
      fullName: record.fullName,
      email: record.email,
      loanType: record.loanType,
      requestedAmount: record.requestedAmount,
      monthlyIncome: record.monthlyIncome,
      creditScore: record.creditScore,
    }));
    setActiveTab('eligibility');
  };

  // Navigate to EMI calculator with parameters
  const handleNavigateToEMI = (amount: number, rate: number, tenureYears: number) => {
    setEmiParameters({ amount, rate, tenureYears });
    setActiveTab('emi');
  };

  // Sync credit score to loan checker
  const handleSyncScoreToLoan = (score: number) => {
    setApplication((prev) => ({ ...prev, creditScore: score }));
    setActiveTab('eligibility');
  };

  // Reset all fields to initial defaults
  const handleReset = () => {
    if (window.confirm('Reset all financial inputs to default values?')) {
      setApplication(INITIAL_APPLICATION);
      setCreditProfile(INITIAL_CREDIT_PROFILE);
    }
  };

  // Quick export all assessments to Google Sheets CSV
  const handleQuickExport = () => {
    if (savedAssessments.length === 0) {
      alert('No assessments in vault to export. Run an eligibility check first!');
      return;
    }
    const csv = generateGoogleSheetsCSV(savedAssessments);
    triggerFileDownload(csv, `AI_Loan_Eligibility_Assessments_${Date.now()}.csv`);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background radial ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedAssessments.length}
        onReset={handleReset}
        onQuickExport={handleQuickExport}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'eligibility' && (
          <LoanEligibilityChecker
            application={application}
            setApplication={setApplication}
            onSaveAssessment={handleSaveAssessment}
            onNavigateToEMI={handleNavigateToEMI}
            onNavigateToCredit={handleSyncScoreToLoan}
          />
        )}

        {activeTab === 'credit' && (
          <CreditScoreAnalyzer
            creditProfile={creditProfile}
            setCreditProfile={setCreditProfile}
            onSyncScoreToLoan={handleSyncScoreToLoan}
          />
        )}

        {activeTab === 'emi' && (
          <EmiCalculator
            initialAmount={emiParameters.amount}
            initialRate={emiParameters.rate}
            initialTenureYears={emiParameters.tenureYears}
          />
        )}

        {activeTab === 'tips' && (
          <AiFinancialTips application={application} />
        )}

        {activeTab === 'sheets' && (
          <SheetsSyncVault
            savedAssessments={savedAssessments}
            onDeleteAssessment={handleDeleteAssessment}
            onLoadAssessment={handleLoadAssessment}
            onClearAll={handleClearAllAssessments}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-slate-950/80 backdrop-blur-md py-6 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">
              AI Loan Eligibility Checker
            </span>
            <span className="text-slate-600">·</span>
            <span>BFSI Intelligence & Retail Credit Decisioning</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gemini 3.8 Flash AI Underwriter</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>Google Sheets CSV & Webhook Ready</span>
            <span className="text-slate-600">·</span>
            <span>Dark Glassmorphism Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
