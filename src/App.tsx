import { useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { BillIntakePanel, InputMode, SelectedFileState } from './components/BillIntakePanel';
import { AnalysisReport } from './components/AnalysisReport';
import { SAMPLE_BILL_PRESETS } from './data/sampleBills';
import type { AnalyzeBillRequest, BillAnalysis, BillInputPayload, SampleBillPreset } from './types/bill';

export default function App() {
  const [mode, setMode] = useState<InputMode>('file');
  const [currentFile, setCurrentFile] = useState<SelectedFileState | null>(null);
  const [currentText, setCurrentText] = useState('');

  const [showPreviousSlot, setShowPreviousSlot] = useState(false);
  const [previousFile, setPreviousFile] = useState<SelectedFileState | null>(null);
  const [previousText, setPreviousText] = useState('');

  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const intakeContainerRef = useRef<HTMLDivElement | null>(null);

  const buildCurrentPayload = (override?: BillInputPayload): BillInputPayload | null => {
    if (override) return override;
    if (mode === 'file' && currentFile) {
      return {
        fileData: {
          mimeType: currentFile.mimeType,
          base64: currentFile.base64,
          fileName: currentFile.fileName,
        },
      };
    }
    if (mode === 'text' && currentText.trim().length > 0) {
      return { rawText: currentText.trim() };
    }
    return null;
  };

  const buildPreviousPayload = (): BillInputPayload | undefined => {
    const hasFile = Boolean(previousFile);
    const hasText = previousText.trim().length > 0;
    if (!hasFile && !hasText) return undefined;

    return {
      ...(previousFile
        ? {
            fileData: {
              mimeType: previousFile.mimeType,
              base64: previousFile.base64,
              fileName: previousFile.fileName,
            },
          }
        : {}),
      ...(hasText ? { rawText: previousText.trim() } : {}),
    };
  };

  const handleAnalyze = async (overrideCurrent?: BillInputPayload) => {
    const currentBill = buildCurrentPayload(overrideCurrent);
    if (!currentBill) {
      setError('Please upload an electricity bill image/PDF or paste bill text first.');
      return;
    }

    const requestBody: AnalyzeBillRequest = {
      currentBill,
      previousBill: buildPreviousPayload(),
    };

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const payload = (await response.json()) as BillAnalysis & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || `Request failed with status ${response.status}.`);
      }

      setAnalysis(payload);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while analyzing your bill.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSample = (preset: SampleBillPreset) => {
    setMode('text');
    setCurrentFile(null);
    setCurrentText(preset.rawText);
    setPreviousFile(null);
    setPreviousText('');
    setShowPreviousSlot(false);
    void handleAnalyze({ rawText: preset.rawText });
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setCurrentFile(null);
    setCurrentText('');
    setPreviousFile(null);
    setPreviousText('');
    setMode('file');
    intakeContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAttachPreviousBill = () => {
    setShowPreviousSlot(true);
    intakeContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopBar hasReport={Boolean(analysis)} onNewAnalysis={handleNewAnalysis} />

      <main className="flex-1 w-full max-w-[1360px] mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] gap-8 items-start">
          <div ref={intakeContainerRef} className="lg:sticky lg:top-24">
            <BillIntakePanel
              mode={mode}
              onModeChange={setMode}
              currentFile={currentFile}
              onCurrentFileChange={setCurrentFile}
              currentText={currentText}
              onCurrentTextChange={setCurrentText}
              showPreviousSlot={showPreviousSlot}
              onTogglePreviousSlot={setShowPreviousSlot}
              previousFile={previousFile}
              onPreviousFileChange={setPreviousFile}
              previousText={previousText}
              onPreviousTextChange={setPreviousText}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              onSelectSample={handleSelectSample}
              fileInputRef={fileInputRef}
            />
          </div>

          <div className="min-w-0">
            <AnalysisReport
              analysis={analysis}
              isLoading={isAnalyzing}
              error={error}
              onRetry={() => void handleAnalyze()}
              onAttachPreviousBill={handleAttachPreviousBill}
              onRunFirstSample={() => handleSelectSample(SAMPLE_BILL_PRESETS[0])}
            />
          </div>
        </div>
      </main>

      <footer className="no-print border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>VoltPlain · Consumer Electricity Bill Explainer</span>
          <span>Zero-guesswork extraction · Numbers match your uploaded document</span>
        </div>
      </footer>
    </div>
  );
}
