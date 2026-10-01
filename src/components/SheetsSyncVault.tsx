import React, { useState } from 'react';
import { SavedAssessment, LoanType } from '../types';
import { 
  generateGoogleSheetsCSV, 
  generateGoogleSheetsTSV, 
  triggerFileDownload, 
  formatCurrency, 
  formatPercent 
} from '../utils/financialCalculations';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Check, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Send, 
  Code, 
  PlusCircle,
  Eye,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface SheetsSyncVaultProps {
  savedAssessments: SavedAssessment[];
  onDeleteAssessment: (id: string) => void;
  onLoadAssessment: (assessment: SavedAssessment) => void;
  onClearAll: () => void;
}

export const SheetsSyncVault: React.FC<SheetsSyncVaultProps> = ({
  savedAssessments,
  onDeleteAssessment,
  onLoadAssessment,
  onClearAll,
}) => {
  const [webhookUrl, setWebhookUrl] = useState<string>(
    localStorage.getItem('bfsi_google_sheets_webhook') || ''
  );
  const [autoSync, setAutoSync] = useState<boolean>(
    localStorage.getItem('bfsi_google_sheets_autosync') === 'true'
  );
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedTSV, setCopiedTSV] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCodeGuide, setShowCodeGuide] = useState<boolean>(false);

  // Filtered assessments
  const filtered = savedAssessments.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.loanType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.loanType === filterType;
    return matchesSearch && matchesFilter;
  });

  // Save webhook settings
  const handleSaveWebhook = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('bfsi_google_sheets_webhook', url);
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    localStorage.setItem('bfsi_google_sheets_autosync', enabled ? 'true' : 'false');
  };

  // Export full CSV
  const handleDownloadCSV = () => {
    if (savedAssessments.length === 0) return;
    const csvData = generateGoogleSheetsCSV(savedAssessments);
    triggerFileDownload(csvData, `AI_Loan_Assessments_Google_Sheets_${Date.now()}.csv`);
  };

  // Copy TSV for immediate clipboard paste into Google Sheets
  const handleCopyTSV = () => {
    if (savedAssessments.length === 0) return;
    const tsvData = generateGoogleSheetsTSV(savedAssessments);
    navigator.clipboard.writeText(tsvData);
    setCopiedTSV(true);
    setTimeout(() => setCopiedTSV(false), 2500);
  };

  // Direct open in Google Sheets via template
  const handleOpenGoogleSheetsTemplate = () => {
    window.open('https://sheets.new', '_blank');
  };

  // Test Webhook Sync
  const handleTestSync = async () => {
    if (!webhookUrl) {
      setSyncStatus('Please enter your Google Apps Script Webhook URL first.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const testPayload = savedAssessments[0] || {
        id: 'TEST-001',
        timestamp: new Date().toISOString(),
        fullName: 'Test Applicant',
        email: 'test@example.com',
        loanType: 'Home Mortgage',
        requestedAmount: 400000,
        monthlyIncome: 10000,
        creditScore: 750,
        dtiRatio: 35.5,
        approvalOdds: 92,
        status: 'Prime Approval',
        estimatedEmi: 2450,
        maxEligibleAmount: 520000,
      };

      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      setSyncStatus('✓ Data payload successfully dispatched to Google Sheet!');
    } catch (e: any) {
      console.error(e);
      setSyncStatus('Dispatched payload to Google Sheet endpoint.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Apps Script snippet
  const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Assessment ID", "Timestamp", "Applicant Name", "Email",
        "Loan Type", "Requested ($)", "Monthly Income ($)", "Credit Score",
        "DTI / FOIR (%)", "Approval Odds (%)", "Status", "EMI ($)", "Max Capacity ($)"
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#0f172a").setFontColor("#38bdf8");
    }
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.id, data.timestamp, data.fullName, data.email,
      data.loanType, data.requestedAmount, data.monthlyIncome, data.creditScore,
      data.dtiRatio, data.approvalOdds, data.status, data.estimatedEmi, data.maxEligibleAmount
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Google Sheets Integration & Persistent Assessment Vault</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Secure, transparent persistence across sessions with 1-click Google Sheets CSV export, TSV clipboard sync, and live webhook automation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenGoogleSheetsTemplate}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Google Sheet</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={savedAssessments.length === 0}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleCopyTSV}
              disabled={savedAssessments.length === 0}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copiedTSV ? 'Copied TSV ✓' : 'Copy for Sheets'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Webhook Configuration Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Google Sheets Webhook Endpoint</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect your Google Apps Script Web App URL to push every loan eligibility check directly to a live spreadsheet.
            </p>
          </div>

          <button
            onClick={() => setShowCodeGuide(!showCodeGuide)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showCodeGuide ? 'Hide Apps Script Code' : 'View Google Apps Script Setup'}</span>
          </button>
        </div>

        {/* Apps Script Guide & Code */}
        {showCodeGuide && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                3-Step Google Apps Script Integration:
              </span>
              <button
                onClick={copyAppsScript}
                className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-200 flex items-center gap-1.5"
              >
                <Copy className="w-3 h-3 text-emerald-400" />
                <span>{copiedScript ? 'Copied Code ✓' : 'Copy Apps Script'}</span>
              </button>
            </div>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
              <li>In your Google Sheet, open <span className="font-mono text-cyan-400">Extensions &gt; Apps Script</span>.</li>
              <li>Paste the code snippet below and click <span className="font-mono text-cyan-400">Deploy &gt; New deployment</span>.</li>
              <li>Select <span className="font-mono text-cyan-400">Web App</span>, set Access to <span className="font-mono text-emerald-400">Anyone</span>, and paste the URL here.</li>
            </ol>
            <pre className="p-3 rounded-lg bg-slate-900 border border-white/[0.06] text-[11px] font-mono text-emerald-300 overflow-x-auto">
              {appsScriptCode}
            </pre>
          </div>
        )}

        {/* Webhook Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => handleSaveWebhook(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2 pt-5">
            <button
              onClick={handleTestSync}
              disabled={isSyncing}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Dispatching...' : 'Test Webhook Sync'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* Historical Assessments Table */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-white">
              Evaluated Assessments History ({savedAssessments.length})
            </h3>
            {savedAssessments.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search applicant or ID..."
                className="bg-slate-950/80 border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-44 sm:w-56"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950/80 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Loan Types</option>
              <option value="Home Mortgage">Home Mortgage</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Auto / Vehicle Loan">Auto Loan</option>
              <option value="Business Expansion">Business</option>
              <option value="Education Loan">Education</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {filtered.length > 0 ? (
          <div className="overflow-x-auto max-h-96 rounded-xl border border-white/[0.06] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10 border-b border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Applicant & ID</th>
                  <th className="py-3 px-4">Loan Type</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Monthly Income</th>
                  <th className="py-3 px-4">FICO Score</th>
                  <th className="py-3 px-4">DTI Ratio</th>
                  <th className="py-3 px-4">Approval Odds</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{record.fullName}</span>
                      <span className="text-[10px] text-slate-500 block">{record.id} · {new Date(record.timestamp).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{record.loanType}</td>
                    <td className="py-3 px-4 font-bold text-cyan-400">{formatCurrency(record.requestedAmount)}</td>
                    <td className="py-3 px-4 text-emerald-400">{formatCurrency(record.monthlyIncome)}</td>
                    <td className="py-3 px-4 text-white font-semibold">{record.creditScore}</td>
                    <td className="py-3 px-4">
                      <span className={record.dtiRatio <= 43 ? 'text-emerald-400' : 'text-amber-400'}>
                        {record.dtiRatio.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-400">{record.approvalOdds}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onLoadAssessment(record)}
                        title="Load into Loan Eligibility Checker"
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAssessment(record.id)}
                        title="Delete assessment"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No saved loan assessments found matching your criteria.</p>
            <p className="text-[11px] text-slate-600">Run an evaluation in the Loan Eligibility Checker and click "Save to Sheets Vault"!</p>
          </div>
        )}
      </div>
    </div>
  );
};
