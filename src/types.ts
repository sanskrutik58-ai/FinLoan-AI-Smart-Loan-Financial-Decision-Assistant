export type LoanType = 
  | 'Home Mortgage' 
  | 'Personal Loan' 
  | 'Auto / Vehicle Loan' 
  | 'Business Expansion' 
  | 'Education Loan';

export type EmploymentType = 
  | 'Salaried (Corporate / MNC)' 
  | 'Salaried (Government / Public)' 
  | 'Self-Employed Professional' 
  | 'Business Owner' 
  | 'Freelancer / Gig Economy';

export interface LoanApplication {
  fullName: string;
  email: string;
  phone: string;
  monthlyIncome: number;
  existingDebts: number;
  loanType: LoanType;
  requestedAmount: number;
  tenureYears: number;
  employmentType: EmploymentType;
  creditScore: number;
  hasCoApplicant: boolean;
  coApplicantIncome: number;
  coApplicantDebts: number;
  downPayment: number;
  propertyValue: number;
}

export interface EligibilityResult {
  approvalOdds: number; // 0 - 100
  riskGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  status: 'Prime Approval' | 'High Approval Odds' | 'Conditional Approval' | 'Elevated Risk' | 'Restructuring Required';
  estimatedEmi: number;
  totalInterest: number;
  totalPayable: number;
  dtiRatio: number; // FOIR percentage
  maxEligibleAmount: number;
  maxEligibleEmi: number;
  interestRateBand: {
    minRate: number;
    maxRate: number;
    selectedRate: number;
  };
  keyFactors: {
    label: string;
    status: 'good' | 'warning' | 'danger';
    detail: string;
  }[];
  recommendations: string[];
  timestamp: string;
}

export interface CreditProfile {
  creditScore: number; // 300 - 850
  paymentHistoryPct: number; // e.g. 99%
  totalCreditLimit: number;
  currentBalance: number;
  creditAgeYears: number;
  totalAccounts: number;
  recentInquiries: number;
  derogatoryMarks: number;
}

export interface AmortizationRow {
  period: number; // month or year number
  label: string;
  payment: number;
  principal: number;
  interest: number;
  totalInterestPaid: number;
  remainingBalance: number;
  equityPercentage: number;
}

export interface SavedAssessment {
  id: string;
  timestamp: string;
  fullName: string;
  email: string;
  loanType: LoanType;
  requestedAmount: number;
  monthlyIncome: number;
  creditScore: number;
  dtiRatio: number;
  approvalOdds: number;
  status: string;
  estimatedEmi: number;
  maxEligibleAmount: number;
  syncedToGoogleSheet?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
