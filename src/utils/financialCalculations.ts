import { LoanApplication, EligibilityResult, AmortizationRow, LoanType, SavedAssessment } from '../types';

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

// Calculate standard monthly EMI
export function calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return principal / tenureMonths;

  const monthlyRate = annualRatePct / 12 / 100;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;

  if (denominator === 0) return 0;
  return Math.round(numerator / denominator);
}

// Calculate present value of loan given an EMI capacity
export function calculateLoanAmountFromEMI(emi: number, annualRatePct: number, tenureMonths: number): number {
  if (emi <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return emi * tenureMonths;

  const monthlyRate = annualRatePct / 12 / 100;
  const factor = (1 - Math.pow(1 + monthlyRate, -tenureMonths)) / monthlyRate;
  return Math.round(emi * factor);
}

// Determine estimated APR based on loan type and credit score
export function getEstimatedAPR(loanType: LoanType, creditScore: number): { minRate: number; maxRate: number; selectedRate: number } {
  let baseRate = 7.0;
  switch (loanType) {
    case 'Home Mortgage':
      baseRate = 6.25;
      break;
    case 'Auto / Vehicle Loan':
      baseRate = 6.75;
      break;
    case 'Education Loan':
      baseRate = 7.5;
      break;
    case 'Personal Loan':
      baseRate = 9.8;
      break;
    case 'Business Expansion':
      baseRate = 10.5;
      break;
  }

  let creditAdjustment = 0;
  if (creditScore >= 780) {
    creditAdjustment = -0.75;
  } else if (creditScore >= 740) {
    creditAdjustment = -0.35;
  } else if (creditScore >= 680) {
    creditAdjustment = 0.25;
  } else if (creditScore >= 620) {
    creditAdjustment = 1.95;
  } else if (creditScore >= 580) {
    creditAdjustment = 4.2;
  } else {
    creditAdjustment = 6.8;
  }

  const selectedRate = Math.max(3.5, Number((baseRate + creditAdjustment).toFixed(2)));
  const minRate = Math.max(3.2, Number((selectedRate - 0.75).toFixed(2)));
  const maxRate = Number((selectedRate + 1.25).toFixed(2));

  return { minRate, maxRate, selectedRate };
}

// Calculate full loan eligibility assessment
export function evaluateLoanEligibility(app: LoanApplication): EligibilityResult {
  const totalIncome = app.monthlyIncome + (app.hasCoApplicant ? (app.coApplicantIncome || 0) : 0);
  const totalExistingDebts = app.existingDebts + (app.hasCoApplicant ? (app.coApplicantDebts || 0) : 0);
  const tenureMonths = Math.max(1, app.tenureYears * 12);

  const rateBand = getEstimatedAPR(app.loanType, app.creditScore);
  const estimatedEmi = calculateEMI(app.requestedAmount, rateBand.selectedRate, tenureMonths);

  const totalPayable = estimatedEmi * tenureMonths;
  const totalInterest = Math.max(0, totalPayable - app.requestedAmount);

  // Total obligations & FOIR
  const totalObligations = totalExistingDebts + estimatedEmi;
  const foirRatio = totalIncome > 0 ? (totalObligations / totalIncome) * 100 : 100;
  const dtiRatio = foirRatio;

  // Maximum allowed FOIR based on income brackets
  let maxAllowedFoir = 0.50; // default 50%
  if (totalIncome < 3000) maxAllowedFoir = 0.40;
  else if (totalIncome < 7500) maxAllowedFoir = 0.50;
  else if (totalIncome < 15000) maxAllowedFoir = 0.55;
  else maxAllowedFoir = 0.60;

  const maxAllowedObligation = totalIncome * maxAllowedFoir;
  const maxEligibleEmi = Math.max(0, maxAllowedObligation - totalExistingDebts);
  const maxEligibleAmount = calculateLoanAmountFromEMI(maxEligibleEmi, rateBand.selectedRate, tenureMonths);

  // Multivariate Approval Odds Scoring (0 - 100)
  // 1. Credit Score score (40 pts)
  let creditPts = 0;
  if (app.creditScore >= 780) creditPts = 40;
  else if (app.creditScore >= 740) creditPts = 36;
  else if (app.creditScore >= 700) creditPts = 32;
  else if (app.creditScore >= 660) creditPts = 26;
  else if (app.creditScore >= 620) creditPts = 18;
  else if (app.creditScore >= 580) creditPts = 10;
  else creditPts = 4;

  // 2. FOIR / DTI score (35 pts)
  let foirPts = 0;
  if (foirRatio <= 28) foirPts = 35;
  else if (foirRatio <= 36) foirPts = 31;
  else if (foirRatio <= 43) foirPts = 26;
  else if (foirRatio <= 50) foirPts = 18;
  else if (foirRatio <= 58) foirPts = 10;
  else foirPts = 2;

  // 3. Employment & Income stability (15 pts)
  let empPts = 10;
  if (app.employmentType.includes('Government')) empPts = 15;
  else if (app.employmentType.includes('Corporate')) empPts = 14;
  else if (app.employmentType.includes('Professional')) empPts = 12;
  else if (app.employmentType.includes('Business')) empPts = 11;
  else empPts = 9;

  // 4. Requested amount vs capacity cushion (10 pts)
  let capacityPts = 0;
  if (maxEligibleAmount >= app.requestedAmount * 1.3) capacityPts = 10;
  else if (maxEligibleAmount >= app.requestedAmount) capacityPts = 8;
  else if (maxEligibleAmount >= app.requestedAmount * 0.8) capacityPts = 5;
  else capacityPts = 1;

  // Co-applicant bonus (+3 pts)
  let coAppBonus = app.hasCoApplicant && app.coApplicantIncome > 1000 ? 3 : 0;

  const rawOdds = creditPts + foirPts + empPts + capacityPts + coAppBonus;
  const approvalOdds = Math.min(99, Math.max(8, rawOdds));

  let status: EligibilityResult['status'] = 'Prime Approval';
  let riskGrade: EligibilityResult['riskGrade'] = 'A+';

  if (approvalOdds >= 85) {
    status = 'Prime Approval';
    riskGrade = 'A+';
  } else if (approvalOdds >= 70) {
    status = 'High Approval Odds';
    riskGrade = 'A';
  } else if (approvalOdds >= 55) {
    status = 'Conditional Approval';
    riskGrade = 'B+';
  } else if (approvalOdds >= 40) {
    status = 'Elevated Risk';
    riskGrade = 'B';
  } else if (approvalOdds >= 25) {
    status = 'Restructuring Required';
    riskGrade = 'C';
  } else {
    status = 'Restructuring Required';
    riskGrade = 'D';
  }

  // Factor diagnostics
  const keyFactors: EligibilityResult['keyFactors'] = [
    {
      label: 'Debt-to-Income / FOIR',
      status: foirRatio <= 40 ? 'good' : foirRatio <= 50 ? 'warning' : 'danger',
      detail: `${foirRatio.toFixed(1)}% of income allocated to debt (institutional threshold: 43-50%)`,
    },
    {
      label: 'Credit Rating Tier',
      status: app.creditScore >= 720 ? 'good' : app.creditScore >= 660 ? 'warning' : 'danger',
      detail: `${app.creditScore} FICO score (${app.creditScore >= 740 ? 'Very Good / Prime' : app.creditScore >= 670 ? 'Good' : 'Sub-prime drag'})`,
    },
    {
      label: 'Loan Capacity Utilization',
      status: app.requestedAmount <= maxEligibleAmount ? 'good' : 'warning',
      detail: `Requesting ${formatCurrency(app.requestedAmount)} against ${formatCurrency(maxEligibleAmount)} max borrowing capacity`,
    },
    {
      label: 'Employment Profile',
      status: empPts >= 12 ? 'good' : 'warning',
      detail: `${app.employmentType} provides verified earning stability`,
    },
  ];

  // Specific recommendations
  const recommendations: string[] = [];
  if (foirRatio > 45) {
    recommendations.push(`Retire $${Math.round(totalExistingDebts * 0.35).toLocaleString()} of high-interest revolving credit to push your DTI ratio below 40%.`);
  }
  if (app.requestedAmount > maxEligibleAmount) {
    recommendations.push(`Consider extending tenure to ${app.tenureYears + 2} years or scaling requested principal to ${formatCurrency(maxEligibleAmount)} for guaranteed qualification.`);
  }
  if (!app.hasCoApplicant && app.requestedAmount > 100000) {
    recommendations.push('Adding a working co-applicant with verified income can boost maximum loan ceiling by 25-40%.');
  }
  if (app.creditScore < 720) {
    recommendations.push('Targeting credit score lift to 740+ will decrease lender risk margin by ~120-180 basis points.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain current pristine debt-to-income balance and request written underwriter pre-approval locks.');
  }

  return {
    approvalOdds,
    riskGrade,
    status,
    estimatedEmi,
    totalInterest,
    totalPayable,
    dtiRatio,
    maxEligibleAmount,
    maxEligibleEmi,
    interestRateBand: rateBand,
    keyFactors,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// Generate Detailed Amortization Schedule (Month by Month & Yearly)
export function generateAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
  extraMonthlyPayment: number = 0
): {
  monthlySchedule: AmortizationRow[];
  yearlySchedule: AmortizationRow[];
  summary: {
    monthlyPayment: number;
    totalInterest: number;
    totalAmount: number;
    actualMonths: number;
    interestSaved: number;
    monthsSaved: number;
  };
} {
  const baseMonthlyRate = annualRatePct / 12 / 100;
  const standardEmi = calculateEMI(principal, annualRatePct, tenureMonths);
  const baselineTotalInterest = (standardEmi * tenureMonths) - principal;

  let balance = principal;
  let totalInterestPaid = 0;
  const monthlySchedule: AmortizationRow[] = [];

  let month = 1;
  const effectiveMonthlyPayment = standardEmi + extraMonthlyPayment;

  while (balance > 0.01 && month <= tenureMonths * 2) {
    const interestForMonth = balance * baseMonthlyRate;
    let principalForMonth = effectiveMonthlyPayment - interestForMonth;

    if (principalForMonth > balance) {
      principalForMonth = balance;
    }

    balance -= principalForMonth;
    totalInterestPaid += interestForMonth;

    const equity = ((principal - balance) / principal) * 100;

    monthlySchedule.push({
      period: month,
      label: `Month ${month}`,
      payment: Math.round(principalForMonth + interestForMonth),
      principal: Math.round(principalForMonth),
      interest: Math.round(interestForMonth),
      totalInterestPaid: Math.round(totalInterestPaid),
      remainingBalance: Math.max(0, Math.round(balance)),
      equityPercentage: Math.min(100, Math.max(0, Number(equity.toFixed(1)))),
    });

    month++;
  }

  // Aggregate yearly schedule
  const yearlySchedule: AmortizationRow[] = [];
  const totalYears = Math.ceil(monthlySchedule.length / 12);

  for (let yr = 1; yr <= totalYears; yr++) {
    const startIdx = (yr - 1) * 12;
    const endIdx = Math.min(monthlySchedule.length, yr * 12);
    const monthsInYear = monthlySchedule.slice(startIdx, endIdx);

    const yearPayment = monthsInYear.reduce((sum, m) => sum + m.payment, 0);
    const yearPrincipal = monthsInYear.reduce((sum, m) => sum + m.principal, 0);
    const yearInterest = monthsInYear.reduce((sum, m) => sum + m.interest, 0);
    const lastMonth = monthsInYear[monthsInYear.length - 1];

    yearlySchedule.push({
      period: yr,
      label: `Year ${yr}`,
      payment: Math.round(yearPayment),
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      totalInterestPaid: lastMonth.totalInterestPaid,
      remainingBalance: lastMonth.remainingBalance,
      equityPercentage: lastMonth.equityPercentage,
    });
  }

  const actualMonths = monthlySchedule.length;
  const actualTotalInterest = totalInterestPaid;
  const interestSaved = Math.max(0, Math.round(baselineTotalInterest - actualTotalInterest));
  const monthsSaved = Math.max(0, tenureMonths - actualMonths);

  return {
    monthlySchedule,
    yearlySchedule,
    summary: {
      monthlyPayment: standardEmi,
      totalInterest: Math.round(actualTotalInterest),
      totalAmount: Math.round(principal + actualTotalInterest),
      actualMonths,
      interestSaved,
      monthsSaved,
    },
  };
}

// Simulate credit score changes based on tactical actions
export function simulateCreditScoreDelta(
  currentScore: number,
  params: {
    paydownAmount: number;
    currentBalance: number;
    creditLimit: number;
    increaseLimitAmount: number;
    simulateLatePayment: boolean;
    simulateCloseOldestCard: boolean;
    simulateNewInquiry: boolean;
  }
): {
  projectedScore: number;
  delta: number;
  newUtilizationPct: number;
  insights: string[];
} {
  const effectiveBalance = Math.max(0, params.currentBalance - params.paydownAmount);
  const effectiveLimit = Math.max(1000, params.creditLimit + params.increaseLimitAmount);
  const newUtilizationPct = Math.round((effectiveBalance / effectiveLimit) * 100);
  const oldUtilizationPct = Math.round((params.currentBalance / params.creditLimit) * 100);

  let delta = 0;
  const insights: string[] = [];

  // Utilization change effect
  const utilDrop = oldUtilizationPct - newUtilizationPct;
  if (utilDrop > 0) {
    if (newUtilizationPct <= 9) {
      delta += Math.min(48, Math.round(utilDrop * 0.9) + 12);
      insights.push(`Dropping utilization to ${newUtilizationPct}% (under 10% prime ceiling) triggers maximum FICO utilization points (+${Math.min(48, Math.round(utilDrop * 0.9) + 12)} pts).`);
    } else if (newUtilizationPct <= 29) {
      delta += Math.min(30, Math.round(utilDrop * 0.7) + 5);
      insights.push(`Lowering revolving debt below 30% removes the elevated balance risk penalty (+${Math.min(30, Math.round(utilDrop * 0.7) + 5)} pts).`);
    } else {
      delta += Math.min(18, Math.round(utilDrop * 0.4));
      insights.push(`Paying down balance reduces debt burden (+${Math.min(18, Math.round(utilDrop * 0.4))} pts).`);
    }
  }

  // Credit limit increase effect
  if (params.increaseLimitAmount > 0) {
    delta += 6;
    insights.push(`Soft-pull credit line increase expanded available credit buffer (+6 pts).`);
  }

  // Late payment penalty (drastic)
  if (params.simulateLatePayment) {
    const penalty = currentScore >= 740 ? -75 : -55;
    delta += penalty;
    insights.push(`A 30-day delinquent payment is heavily penalized on FICO/Vantage models (${penalty} pts).`);
  }

  // Closing oldest card
  if (params.simulateCloseOldestCard) {
    delta -= 18;
    insights.push(`Closing oldest card shortens average credit age and reduces total available credit line (-18 pts).`);
  }

  // New credit card inquiry
  if (params.simulateNewInquiry) {
    delta -= 7;
    insights.push(`A hard credit inquiry creates a brief minor score dip (-7 pts).`);
  }

  const projectedScore = Math.min(850, Math.max(300, currentScore + delta));

  return {
    projectedScore,
    delta,
    newUtilizationPct,
    insights,
  };
}

// Export Saved Assessments to CSV format for Google Sheets import
export function generateGoogleSheetsCSV(records: SavedAssessment[]): string {
  const headers = [
    'Assessment ID',
    'Date / Timestamp',
    'Applicant Name',
    'Email Address',
    'Loan Type',
    'Requested Amount ($)',
    'Monthly Income ($)',
    'Credit Score',
    'DTI / FOIR Ratio (%)',
    'Approval Odds (%)',
    'Approval Status',
    'Estimated Monthly EMI ($)',
    'Max Eligible Loan Capacity ($)',
    'Synced To Sheet',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.timestamp}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.email.replace(/"/g, '""')}"`,
    `"${r.loanType}"`,
    r.requestedAmount,
    r.monthlyIncome,
    r.creditScore,
    r.dtiRatio.toFixed(1),
    r.approvalOdds,
    `"${r.status}"`,
    r.estimatedEmi,
    r.maxEligibleAmount,
    r.syncedToGoogleSheet ? 'YES' : 'NO',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

// Generate TSV for direct paste into Google Sheets
export function generateGoogleSheetsTSV(records: SavedAssessment[]): string {
  const headers = [
    'Assessment ID',
    'Date',
    'Applicant Name',
    'Loan Type',
    'Requested Amount',
    'Monthly Income',
    'Credit Score',
    'DTI Ratio',
    'Approval Odds',
    'Status',
    'Estimated EMI',
    'Max Eligible Capacity',
  ];

  const rows = records.map((r) => [
    r.id,
    new Date(r.timestamp).toLocaleDateString(),
    r.fullName,
    r.loanType,
    `$${r.requestedAmount.toLocaleString()}`,
    `$${r.monthlyIncome.toLocaleString()}`,
    r.creditScore,
    `${r.dtiRatio.toFixed(1)}%`,
    `${r.approvalOdds}%`,
    r.status,
    `$${r.estimatedEmi.toLocaleString()}`,
    `$${r.maxEligibleAmount.toLocaleString()}`,
  ]);

  return [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
}

// Download file trigger helper
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
