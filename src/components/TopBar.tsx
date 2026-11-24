import React from 'react';

interface TopBarProps {
  hasReport: boolean;
  onNewAnalysis: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ hasReport, onNewAnalysis }) => {
  return (
    <header className="no-print sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0"
        >
          VoltPlain
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#summary"
            className="hover:text-[#0F172A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Summary
          </a>
          <a
            href="#breakdown"
            className="hover:text-[#0F172A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Breakdown
          </a>
          <a
            href="#comparison"
            className="hover:text-[#0F172A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Comparison
          </a>
          <a
            href="#alerts"
            className="hover:text-[#0F172A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Spike Alerts
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewAnalysis}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] cursor-pointer"
          >
            {hasReport ? 'Analyze New Bill' : 'Upload Bill'}
          </button>
        </div>
      </div>
    </header>
  );
};
