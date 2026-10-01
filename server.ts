import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('GEMINI_API_KEY not found in environment. Server will use intelligent fallback responses.');
}

// Helper to safely call Gemini with fallback
async function generateAIResponse(prompt: string, fallbackGenerator: () => any) {
  if (!ai || !apiKey) {
    return fallbackGenerator();
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || '';
  } catch (err: any) {
    console.error('Gemini API call failed:', err?.message || err);
    return fallbackGenerator();
  }
}

// 1. AI Loan Underwriting Analysis Endpoint
app.post('/api/ai/loan-analysis', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      monthlyIncome,
      existingDebts,
      loanType,
      requestedAmount,
      tenureYears,
      employmentType,
      creditScore,
      dtiRatio,
      foirRatio,
      approvalOdds,
      estimatedEmi,
      maxEligibleAmount,
    } = req.body;

    const prompt = `You are a Senior BFSI (Banking, Financial Services & Insurance) Credit Underwriter and Financial Risk Analyst.
Analyze the following personal loan application thoroughly and provide a structured professional evaluation:

Applicant Information:
- Name: ${fullName || 'Applicant'}
- Employment Type: ${employmentType || 'Salaried'}
- Monthly Gross Income: $${monthlyIncome?.toLocaleString()}
- Existing Monthly Debt/EMIs: $${existingDebts?.toLocaleString()}
- Credit Score: ${creditScore} / 850
- Loan Type Requested: ${loanType}
- Requested Loan Amount: $${requestedAmount?.toLocaleString()}
- Loan Tenure: ${tenureYears} Years
- Projected Monthly EMI: $${estimatedEmi?.toLocaleString()}
- Calculated Debt-To-Income (DTI) / FOIR: ${dtiRatio?.toFixed(1)}%
- Algorithmic Approval Odds: ${approvalOdds}%
- Estimated Maximum Loan Capacity: $${maxEligibleAmount?.toLocaleString()}

Please provide a structured, professional, high-fidelity BFSI credit assessment. Format your answer clearly using Markdown with the following sections:
1. ### Underwriting Decision & Risk Grade (Clear verdict: Prime Approval, Conditional Approval, or High-Risk / Needs Restructuring, with a letter grade A+ to D).
2. ### Key Credit Strengths (3 bullet points highlighting positive metrics like DTI headroom, credit tier, or income consistency).
3. ### Risk Factors & Stress Points (2-3 bullet points examining potential vulnerabilities such as interest rate hikes, high FOIR, or debt concentration).
4. ### Actionable Optimization Strategy (Exact steps the applicant can take right now to lower their APR by 50-150 bps or increase their approval ceiling, e.g. adding a co-applicant, pre-paying a specific balance, or adjusting tenure).
5. ### Lender Perspective & Interest Rate Guidance (Expected APR benchmark range for this specific risk band and recommendations on fixed vs floating rates).

Keep your analysis crisp, authoritative, empathetic, and strictly grounded in real-world retail banking underwriting standards.`;

    const fallbackResponse = `### Underwriting Decision & Risk Grade
**Verdict:** ${approvalOdds >= 75 ? 'Prime Approval Recommended' : approvalOdds >= 50 ? 'Conditional Approval' : 'High-Risk / Restructuring Required'} (Grade: ${approvalOdds >= 80 ? 'A' : approvalOdds >= 65 ? 'B+' : approvalOdds >= 50 ? 'B-' : 'C'})

### Key Credit Strengths
* **Credit Profile:** Your credit score of ${creditScore} places you in the ${creditScore >= 740 ? 'Prime/Very Good tier, qualifying you for the most competitive bank margins' : 'Standard tier with solid baseline qualification'}.
* **Income Coverage:** A gross monthly income of $${monthlyIncome?.toLocaleString()} provides substantial cash flow to service debt obligations.
* **Loan Fit:** The requested $${requestedAmount?.toLocaleString()} over ${tenureYears} years generates an estimated EMI of $${estimatedEmi?.toLocaleString()}/month.

### Risk Factors & Stress Points
* **Debt Burden (DTI/FOIR):** Your combined monthly debt obligation would sit at ${dtiRatio?.toFixed(1)}% of gross income. Standard institutional safety thresholds prefer total obligations below 43-45%.
* **Tenure Exposure:** Over ${tenureYears} years, cumulative interest charges require disciplined amortization and early prepayment considerations.

### Actionable Optimization Strategy
* **Lower Debt Ratio:** Retiring $${Math.round((existingDebts || 0) * 0.3).toLocaleString()} of existing short-term revolving debt could improve your debt-to-income ratio by 3-5 percentage points.
* **Tenure Fine-Tuning:** If monthly cash flow permits, shortening the tenure by 1-2 years will significantly cut total interest payout.
* **Co-Applicant Benefit:** Adding an earning co-signer can expand your borrowing headroom up to $${Math.round(maxEligibleAmount * 1.25).toLocaleString()}.

### Lender Perspective & Interest Rate Guidance
Lenders view this profile favorably with standard documentation verification (W-2s, 3 months paystubs, and bank statements). Expected APR band: **${creditScore >= 750 ? '5.4% - 6.8%' : creditScore >= 680 ? '6.9% - 8.5%' : '8.9% - 11.5%'}**.`;

    const analysisText = await generateAIResponse(prompt, () => fallbackResponse);

    res.json({
      success: true,
      analysis: analysisText,
    });
  } catch (error: any) {
    console.error('Error in loan analysis:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate analysis' });
  }
});

// 2. AI Credit Score Analyzer & Repair Roadmap Endpoint
app.post('/api/ai/credit-analysis', async (req: Request, res: Response) => {
  try {
    const { creditScore, paymentHistoryPct, utilizationPct, creditAgeYears, totalAccounts, recentInquiries } = req.body;

    const prompt = `You are a certified BFSI Credit Counselor and FICO Scoring Model Specialist.
Provide an intelligent, tactical credit score analysis and 30-60-90 day repair/optimization roadmap for a client with the following credit parameters:

- Credit Score: ${creditScore} / 850
- On-Time Payment History: ${paymentHistoryPct}%
- Credit Card Utilization Ratio: ${utilizationPct}%
- Average Age of Accounts: ${creditAgeYears} years
- Total Active Accounts: ${totalAccounts}
- Hard Inquiries (Last 12 Months): ${recentInquiries}

Format your response in Markdown with:
1. ### Credit Health Diagnosis (An honest summary of why their score is at ${creditScore} and their single biggest drag).
2. ### 30-Day Tactical Quick Wins (Immediate impact actions like statement closing date optimization, rapid rescore, or disputing errors).
3. ### 60-Day Structural Improvements (Credit utilization redistribution, authorized user strategy, debt avalanche).
4. ### 90-Day Long-Term Fortification (Account aging protections, credit mix balancing, inquiry mitigation).
5. ### Projected Score Trajectory (Realistic estimate of points gain in 3-6 months if roadmap is followed).

Be concrete, avoiding generic clichés, and provide actionable financial steps.`;

    const fallbackResponse = `### Credit Health Diagnosis
With a credit score of **${creditScore}**, your overall profile is currently ${creditScore >= 740 ? 'strong with high approval leverage' : creditScore >= 670 ? 'in the good range with immediate headroom for prime optimization' : 'under moderate drag from high utilization or recent inquiries'}. 
Your credit utilization stands at **${utilizationPct}%** (ideal benchmark is under 10% for maximum FICO points, with 30% being the hard threshold).

### 30-Day Tactical Quick Wins
* **Statement Date Timing:** Pay down credit card balances 3-5 days *before* your statement closing date rather than the payment due date. This ensures a lower balance is reported to credit bureaus.
* **Credit Limit Request:** Request a soft-pull credit limit increase on your oldest active cards to instantly drop your utilization ratio without incurring a hard inquiry.

### 60-Day Structural Improvements
* **Revolving Debt Paydown:** Target the cards with utilization exceeding 40% first to remove per-card penalty thresholds.
* **Preserve Old Accounts:** Keep zero-balance cards open and make a small recurring charge (e.g. $5 subscription) with auto-pay to prevent inactivity closure and maintain account age.

### 90-Day Long-Term Fortification
* **Freeze Inquiries:** Avoid applying for new retail store cards or personal loans for the next 6 months to let existing ${recentInquiries} inquiries age past the 12-month impact window.
* **Credit Mix:** Maintain a balanced portfolio of at least 1 installment loan and 2-3 revolving credit lines.

### Projected Score Trajectory
By systematically reducing utilization below 15% and keeping zero 30-day late payments, you can realistically expect a **+25 to +55 point lift** within the next 90 to 180 days.`;

    const roadmapText = await generateAIResponse(prompt, () => fallbackResponse);

    res.json({
      success: true,
      roadmap: roadmapText,
    });
  } catch (error: any) {
    console.error('Error in credit analysis:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate credit roadmap' });
  }
});

// 3. AI Interactive Financial Advisor Chat Endpoint
app.post('/api/ai/advisor-chat', async (req: Request, res: Response) => {
  try {
    const { message, chatHistory, financialContext } = req.body;

    const contextStr = financialContext ? `
User's Financial Profile:
- Monthly Income: $${financialContext.monthlyIncome || 'N/A'}
- Existing Debt: $${financialContext.existingDebts || 'N/A'}
- Desired Loan: $${financialContext.requestedAmount || 'N/A'} (${financialContext.loanType || 'Personal'})
- Credit Score: ${financialContext.creditScore || 'N/A'}
- DTI: ${financialContext.dtiRatio?.toFixed(1) || 'N/A'}%
` : '';

    const historyPrompt = (chatHistory || [])
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'Client' : 'BFSI Advisor'}: ${m.content}`)
      .join('\n');

    const prompt = `You are a trusted Senior Financial Advisor and BFSI Banking Expert at an elite banking institution.
${contextStr}

Previous conversation:
${historyPrompt}

Client asks: "${message}"

Provide a clear, accurate, practical, and highly helpful response. Include relevant mathematical calculations, trade-offs, interest rate implications, tax benefits (where applicable), and direct advice tailored to their situation. Keep answers professional, concise, formatted with clean bullet points where appropriate, and avoid generic fluff.`;

    const fallbackResponse = `Regarding your query about "${message}":
From a BFSI and banking standpoint, the most critical factors to balance are your **effective annual percentage rate (APR)**, total interest liability over the amortization timeline, and monthly cash flow flexibility.

Based on current institutional lending benchmarks:
1. **Cash Flow vs Total Cost:** Extending loan tenure lowers your monthly payment burden, but increases total cumulative interest. If cash flow allows, a shorter tenure with higher principal repayment saves substantial interest.
2. **Prepayment Strategy:** Check if your lender charges prepayment penalties. Most prime loans allow penalty-free principal prepayments, which directly reduce compounding interest.
3. **Risk Mitigation:** Always maintain at least 3-6 months of essential debt obligations in a liquid high-yield reserve before making aggressive debt prepayments.

Let me know if you would like me to calculate specific numbers or compare two distinct scenarios!`;

    const reply = await generateAIResponse(prompt, () => fallbackResponse);

    res.json({
      success: true,
      reply: reply,
    });
  } catch (error: any) {
    console.error('Error in advisor chat:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate reply' });
  }
});

// 4. AI Quick Financial Insights & Underwriter Tips Endpoint
app.post('/api/ai/quick-tips', async (req: Request, res: Response) => {
  try {
    const { loanType, income, dti, creditScore } = req.body;

    const prompt = `Generate 4 concise, high-value BFSI financial tips specifically for a borrower looking for a ${loanType || 'Personal'} loan with an income of $${income}/mo, DTI of ${dti}%, and credit score of ${creditScore}.
Format as a JSON array of objects with keys: "title", "description", "category" (one of: 'Rate Optimization', 'Debt Strategy', 'Cash Flow', 'Underwriting').
Respond ONLY with a valid JSON array.`;

    const fallbackTips = [
      {
        title: 'Optimize Statement Closing Date',
        description: 'Pay down balances 4 days prior to your billing cycle closing date so credit bureaus register under 15% utilization.',
        category: 'Rate Optimization',
      },
      {
        title: 'Automated Debt Snowball Focus',
        description: 'Eliminate smallest revolving balances first to free up monthly cash flow and rapidly decrease your DTI ratio.',
        category: 'Debt Strategy',
      },
      {
        title: 'Pre-Approval Rate Lock Advantage',
        description: 'Securing a formal underwriter pre-approval locks in current benchmark rates for 60-90 days against rate increases.',
        category: 'Underwriting',
      },
      {
        title: 'Liquidity Reserve Buffer',
        description: 'Keep 3 months of proposed EMI payments in liquid savings; underwriters heavily reward documented cash reserves.',
        category: 'Cash Flow',
      },
    ];

    if (!ai || !apiKey) {
      return res.json({ success: true, tips: fallbackTips });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ success: true, tips: parsed });
      }
    } catch (e) {
      console.warn('Fallback to standard tips due to JSON parsing error:', e);
    }

    res.json({ success: true, tips: fallbackTips });
  } catch (error: any) {
    console.error('Error in quick tips:', error);
    res.status(500).json({ success: false, error: error?.message });
  }
});

// Vite Middleware integration for development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Production static file serving
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`AI Loan Eligibility Checker server running on port ${port}`);
});
