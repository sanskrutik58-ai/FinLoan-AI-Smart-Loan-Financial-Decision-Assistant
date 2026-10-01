import React, { useState } from 'react';
import { LoanApplication, ChatMessage } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  TrendingDown, 
  ShieldCheck, 
  DollarSign, 
  Percent,
  CheckCircle2,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface AiFinancialTipsProps {
  application: LoanApplication;
}

export const AiFinancialTips: React.FC<AiFinancialTipsProps> = ({ application }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to your AI Financial & Underwriting Consultation. I am your BFSI risk and advisory intelligence assistant. 

Based on your current profile:
- Monthly Income: $${application.monthlyIncome.toLocaleString()}
- Desired Loan: $${application.requestedAmount.toLocaleString()} (${application.loanType})
- Credit Score: ${application.creditScore}

Ask me anything about loan structuring, DTI optimization, mortgage points, refinancing math, or underwriting rules!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Curated BFSI Strategic Tips
  const strategicTips = [
    {
      title: 'DTI Underwriting Thresholds',
      category: 'Underwriting',
      desc: 'Prime retail lenders use a 28/36 rule: front-end housing debt should not exceed 28%, and total obligations (DTI/FOIR) must stay below 36-43% for lowest APRs.',
      action: 'Keep total monthly debt payments under 40% of gross income before applying.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
    {
      title: 'Statement Closing Date Optimization',
      category: 'Rate Optimization',
      desc: 'Credit bureaus capture card balances on the statement date, not your due date. Pay down balances 3 days before statement generation for sub-10% reported utilization.',
      action: 'Results in +15 to +35 FICO point surge within 30 days.',
      icon: Percent,
      color: 'text-cyan-400',
    },
    {
      title: 'Debt Avalanche vs Snowball',
      category: 'Debt Strategy',
      desc: 'The avalanche method (paying highest APR debts first) minimizes total compounding interest, while snowball (smallest balances first) immediately compresses your DTI count.',
      action: 'If applying for a loan soon, use snowball to eliminate entire monthly EMI lines.',
      icon: TrendingDown,
      color: 'text-teal-400',
    },
    {
      title: 'Pre-Approval vs Pre-Qualification',
      category: 'Approval Strategy',
      desc: 'Pre-qualification is an unverified estimate. Formal Underwriter Pre-Approval verifies tax returns, locks in your rate for 60-90 days, and gives you cash-buyer leverage.',
      action: 'Request a formal written rate lock during volatile interest rate periods.',
      icon: DollarSign,
      color: 'text-amber-400',
    },
  ];

  // Quick prompt questions
  const samplePrompts = [
    'Should I take a 15-year or 30-year mortgage?',
    'How can I lower my DTI ratio quickly to qualify for more?',
    'Is it worth paying points to lower my interest rate?',
    'What do underwriters look for in bank statements?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || inputMessage;
    if (!messageContent.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          chatHistory: messages.slice(-5),
          financialContext: {
            monthlyIncome: application.monthlyIncome,
            existingDebts: application.existingDebts,
            requestedAmount: application.requestedAmount,
            loanType: application.loanType,
            creditScore: application.creditScore,
            dtiRatio: ((application.existingDebts) / (application.monthlyIncome || 1)) * 100,
          },
        }),
      });

      const data = await response.json();
      const aiReply = data.reply || 'I am currently unable to reach the underwriting engine. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Unable to connect to the BFSI intelligence engine. Please check your connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>AI Financial Tips & Real-Time Underwriting Advisory</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Expert BFSI intelligence powered by Gemini 3.8 Flash to optimize loan approval terms, debt structure, and interest rates.
        </p>
      </div>

      {/* 4 Strategic BFSI Tips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {strategicTips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                    {tip.category}
                  </span>
                  <Icon className={`w-4 h-4 ${tip.color}`} />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {tip.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tip.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.06] text-[11px] text-emerald-300 font-medium">
                💡 {tip.action}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive AI Financial Advisor Chat */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Live AI Retail Underwriter & Loan Advisor
              </h3>
              <p className="text-xs text-slate-400">
                Contextual banking advice calibrated to your ${application.monthlyIncome.toLocaleString()} income & {application.loanType} request
              </p>
            </div>
          </div>

          {/* Quick prompt chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500">Quick inquiries:</span>
            {samplePrompts.slice(0, 2).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-950/80 border border-white/[0.08] text-slate-200 whitespace-pre-wrap rounded-tl-none font-sans'
                }`}
              >
                {msg.content}
                <span className={`block text-[10px] mt-1.5 font-mono ${msg.role === 'user' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 py-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>BFSI Underwriting Assistant is evaluating your financial request...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask your underwriter: e.g. How does my $650 car loan affect my mortgage borrowing limit?"
            className="flex-1 bg-slate-950/80 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
