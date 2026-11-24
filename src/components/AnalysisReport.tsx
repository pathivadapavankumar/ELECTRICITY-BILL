import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  TrendingUp,
  Info,
  Upload,
} from 'lucide-react';
import type { BillAnalysis, SpikeStatus } from '../types/bill';

interface AnalysisReportProps {
  analysis: BillAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onAttachPreviousBill: () => void;
  onRunFirstSample: () => void;
}

function getSpikeVisualMeta(status: SpikeStatus) {
  switch (status) {
    case 'High Spike Alert':
      return {
        colorClass: 'text-[#DC2626]',
        surfaceClass: 'bg-[#FEF2F2] border-[#FECACA]',
        Icon: AlertTriangle,
      };
    case 'Moderate Increase':
      return {
        colorClass: 'text-[#D97706]',
        surfaceClass: 'bg-[#FFFBEB] border-[#FDE68A]',
        Icon: TrendingUp,
      };
    default:
      return {
        colorClass: 'text-[#16A34A]',
        surfaceClass: 'bg-[#F0FDF4] border-[#BBF7D0]',
        Icon: CheckCircle2,
      };
  }
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({
  analysis,
  isLoading,
  error,
  onRetry,
  onAttachPreviousBill,
  onRunFirstSample,
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'markdown'>('visual');
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis.markdownReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="Analyzing electricity bill" className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="h-5 w-64 bg-slate-200 rounded animate-pulse" />
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-10 w-full bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="h-5 w-56 bg-slate-200 rounded animate-pulse" />
          <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="bg-white border border-[#FECACA] rounded-xl p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">
              Unable to analyze this bill
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-8 lg:p-10 space-y-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight text-balance">
            Understand every rupee, dollar, or kilowatt-hour on your electricity bill
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Upload a bill photo, PDF, or paste raw statement text. We translate utility jargon into everyday language, verify month-over-month changes, and flag hidden spikes.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onRunFirstSample}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors cursor-pointer"
            >
              Run Sample Bill Analysis
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-[#0F172A]">
              01. Quick Bill Summary
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Extracts your billing period, total amount due, payment deadline, units consumed, and whether the meter read was actual or estimated.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-[#0F172A]">
              02. Plain-Language Charge Breakdown
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Decodes fixed demand fees, fuel surcharges (FPPCA/FAC), wheeling fees, electricity duties, and subsidies into one-sentence explanations.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-[#0F172A]">
              03. Month-over-Month Comparison
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Calculates exact unit and percentage differences against your prior month, or flags when previous history is missing from the page.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-[#0F172A]">
              04. Unusual Increases &amp; Spike Alerts
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Spots tariff slab jumps, &gt;15% usage spikes, or arrears, and suggests practical causes and one clear step to lower next month&apos;s bill.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { summary, chargeBreakdown, monthOverMonth, spikeAlerts, markdownReport } = analysis;
  const spikeMeta = getSpikeVisualMeta(spikeAlerts.status);
  const SpikeIcon = spikeMeta.Icon;

  const maxUnits = Math.max(
    monthOverMonth.lastMonthNumericUnits ?? 0,
    monthOverMonth.thisMonthNumericUnits ?? 0,
    1
  );

  return (
    <div className="space-y-6 print-full">
      {/* Report Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl px-5 py-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'visual'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            Structured View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('markdown')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'markdown'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            Markdown Report
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Copy Report</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {viewMode === 'markdown' ? (
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <pre className="whitespace-pre-wrap text-sm text-[#0F172A] font-mono-tabular leading-relaxed overflow-x-auto">
            {markdownReport}
          </pre>
        </section>
      ) : (
        <div className="space-y-6">
          {/* 1. Quick Bill Summary */}
          <section id="summary" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                1. Quick Bill Summary
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{summary.utilityProvider}</span>
                <span aria-hidden="true">·</span>
                <span>{summary.tariffCategory}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="p-5 space-y-1">
                <p className="text-xs font-medium text-slate-500">Billing Period</p>
                <p className="text-sm font-semibold text-[#0F172A] font-mono-tabular leading-snug">
                  {summary.billingPeriod}
                </p>
              </div>

              <div className="p-5 space-y-1">
                <p className="text-xs font-medium text-slate-500">Total Amount Due</p>
                <p className="text-xl font-bold text-[#0F172A] font-mono-tabular tracking-tight">
                  {summary.totalAmountDue}
                </p>
                <p className="text-xs text-slate-500 font-mono-tabular">
                  Due by: {summary.dueDate}
                </p>
              </div>

              <div className="p-5 space-y-1">
                <p className="text-xs font-medium text-slate-500">Total Units Consumed</p>
                <p className="text-xl font-bold text-[#0F172A] font-mono-tabular tracking-tight">
                  {summary.totalUnitsConsumed}
                </p>
              </div>

              <div className="p-5 space-y-1">
                <p className="text-xs font-medium text-slate-500">Meter Reading Status</p>
                <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
                  {summary.meterReadingStatus.toLowerCase().includes('estimated') ? (
                    <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
                  ) : summary.meterReadingStatus.toLowerCase().includes('actual') ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" aria-hidden="true" />
                  ) : (
                    <Info className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                  <span>{summary.meterReadingStatus}</span>
                </p>
              </div>
            </div>
          </section>

          {/* 2. Plain-Language Charge Breakdown */}
          <section id="breakdown" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                2. Plain-Language Charge Breakdown
              </h2>
              <span className="text-xs text-slate-500 font-mono-tabular">
                {chargeBreakdown.length} line items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC]">
                    <th scope="col" className="py-3 px-6 text-xs font-semibold text-slate-600">
                      Charge Name on Bill
                    </th>
                    <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-600 text-right whitespace-nowrap">
                      Amount
                    </th>
                    <th scope="col" className="py-3 px-6 text-xs font-semibold text-slate-600">
                      What This Actually Means
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {chargeBreakdown.length > 0 ? (
                    chargeBreakdown.map((item, idx) => (
                      <tr key={`${item.chargeName}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6 font-medium text-[#0F172A] align-top">
                          {item.chargeName}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#0F172A] text-right whitespace-nowrap align-top">
                          {item.amount}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 leading-relaxed align-top">
                          {item.plainExplanation}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 px-6 text-sm text-slate-500 text-center">
                        Itemized sub-charges were not visible on the uploaded bill.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Month-over-Month Comparison */}
          <section id="comparison" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                3. Month-over-Month Comparison
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Last Month</p>
                  <p className="text-lg font-bold text-[#0F172A] font-mono-tabular">
                    {monthOverMonth.lastMonthUnits}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-tabular">
                    Amount: {monthOverMonth.lastMonthAmount}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">This Month</p>
                  <p className="text-lg font-bold text-[#0F172A] font-mono-tabular">
                    {monthOverMonth.thisMonthUnits}
                  </p>
                  <p className="text-xs text-slate-500 font-mono-tabular">
                    Amount: {monthOverMonth.thisMonthAmount}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">Difference</p>
                  <p className="text-lg font-bold text-[#0F172A] font-mono-tabular">
                    {monthOverMonth.unitDifference}
                  </p>
                  <p className="text-xs text-slate-600 font-mono-tabular font-medium">
                    Change: {monthOverMonth.percentageChange}
                  </p>
                </div>
              </div>

              {/* Visual Bar Comparison when numeric values exist */}
              {monthOverMonth.isAvailable &&
                monthOverMonth.lastMonthNumericUnits !== null &&
                monthOverMonth.thisMonthNumericUnits !== null && (
                  <div className="space-y-3 pb-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">Last Month</span>
                        <span className="font-mono-tabular text-slate-700">{monthOverMonth.lastMonthUnits}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full transition-all"
                          style={{
                            width: `${Math.max(
                              4,
                              Math.round((monthOverMonth.lastMonthNumericUnits / maxUnits) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#0F172A]">This Month</span>
                        <span className="font-mono-tabular font-semibold text-[#0F172A]">
                          {monthOverMonth.thisMonthUnits}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0F766E] rounded-full transition-all"
                          style={{
                            width: `${Math.max(
                              4,
                              Math.round((monthOverMonth.thisMonthNumericUnits / maxUnits) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                  <span className="font-semibold text-[#0F172A]">Verdict: </span>
                  {monthOverMonth.verdict}
                </p>

                {!monthOverMonth.isAvailable && (
                  <button
                    type="button"
                    onClick={onAttachPreviousBill}
                    className="no-print px-3.5 py-2 text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] hover:bg-[#CCFBF1]/60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Attach Previous Month&apos;s Bill</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 4. Unusual Increases & Spike Alerts */}
          <section id="alerts" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                4. Unusual Increases &amp; Spike Alerts
              </h2>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${spikeMeta.colorClass}`}>
                <SpikeIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{spikeAlerts.status}</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-1">What Changed</h3>
                <p className="text-sm text-[#0F172A] leading-relaxed">
                  {spikeAlerts.whatChanged}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2">Likely Reasons</h3>
                <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                  {spikeAlerts.likelyReasons.map((reason, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`border rounded-lg p-4 ${spikeMeta.surfaceClass}`}>
                <p className="text-xs font-semibold text-[#0F172A] mb-1">
                  Actionable Tip for Next Month
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {spikeAlerts.actionableTip}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
