import React, { useRef, useState } from 'react';
import { Upload, FileText, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { BillInputPayload, SampleBillPreset } from '../types/bill';
import { SAMPLE_BILL_PRESETS } from '../data/sampleBills';

export type InputMode = 'file' | 'text';

export interface SelectedFileState {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64: string;
  previewUrl?: string;
}

interface BillIntakePanelProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  currentFile: SelectedFileState | null;
  onCurrentFileChange: (file: SelectedFileState | null) => void;
  currentText: string;
  onCurrentTextChange: (text: string) => void;
  showPreviousSlot: boolean;
  onTogglePreviousSlot: (open: boolean) => void;
  previousFile: SelectedFileState | null;
  onPreviousFileChange: (file: SelectedFileState | null) => void;
  previousText: string;
  onPreviousTextChange: (text: string) => void;
  isAnalyzing: boolean;
  onAnalyze: (overrideCurrent?: BillInputPayload) => void;
  onSelectSample: (preset: SampleBillPreset) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_TYPES = '.png,.jpg,.jpeg,.webp,.heic,.pdf,image/png,image/jpeg,image/webp,application/pdf';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<SelectedFileState> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error(`"${file.name}" exceeds the 15 MB file size limit.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const isImage = file.type.startsWith('image/');
      resolve({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        base64: result,
        previewUrl: isImage ? result : undefined,
      });
    };
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export const BillIntakePanel: React.FC<BillIntakePanelProps> = ({
  mode,
  onModeChange,
  currentFile,
  onCurrentFileChange,
  currentText,
  onCurrentTextChange,
  showPreviousSlot,
  onTogglePreviousSlot,
  previousFile,
  onPreviousFileChange,
  previousText,
  onPreviousTextChange,
  isAnalyzing,
  onAnalyze,
  onSelectSample,
  fileInputRef,
}) => {
  const previousFileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelection = async (file: File | undefined, isPrevious: boolean) => {
    if (!file) return;
    setFileError(null);
    try {
      const parsed = await readFileAsBase64(file);
      if (isPrevious) {
        onPreviousFileChange(parsed);
      } else {
        onCurrentFileChange(parsed);
      }
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'Unable to load the selected file.');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onModeChange('file');
      await handleFileSelection(file, false);
    }
  };

  const canAnalyze =
    !isAnalyzing &&
    ((mode === 'file' && Boolean(currentFile)) || (mode === 'text' && currentText.trim().length > 0));

  return (
    <aside className="no-print bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#0F172A] tracking-tight">
          Electricity Bill Intake
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          Upload a photo, PDF statement, or paste raw bill text to get a plain-language breakdown.
        </p>
      </div>

      {/* Segmented Mode Control */}
      <div
        role="tablist"
        aria-label="Bill input method"
        className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'file'}
          onClick={() => onModeChange('file')}
          className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            mode === 'file'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-slate-600 hover:text-[#0F172A]'
          }`}
        >
          Upload Image or PDF
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          onClick={() => onModeChange('text')}
          className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            mode === 'text'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-slate-600 hover:text-[#0F172A]'
          }`}
        >
          Paste Bill Text
        </button>
      </div>

      {/* Current Bill Input */}
      {mode === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            onChange={(e) => {
              handleFileSelection(e.target.files?.[0], false);
              e.target.value = '';
            }}
          />

          {!currentFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[#0F766E] bg-[#F0FDFA]'
                  : 'border-slate-300 bg-[#F8FAFC] hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto text-slate-500 mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-[#0F172A]">
                Drop your bill here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-500">
                PNG, JPG, WEBP, or PDF · Up to 15 MB
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-3.5 bg-[#F8FAFC]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {currentFile.previewUrl ? (
                    <img
                      src={currentFile.previewUrl}
                      alt={`Preview of ${currentFile.fileName}`}
                      className="w-12 h-12 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-slate-200/70 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-700" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {currentFile.fileName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                      {formatBytes(currentFile.sizeBytes)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCurrentFileChange(null)}
                  aria-label="Remove uploaded bill"
                  className="p-1.5 text-slate-500 hover:text-[#0F172A] rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="current-bill-text" className="block text-xs font-medium text-slate-700 mb-1.5">
            Current Month Bill Text / OCR Output
          </label>
          <textarea
            id="current-bill-text"
            rows={8}
            value={currentText}
            onChange={(e) => onCurrentTextChange(e.target.value)}
            placeholder="Paste text copied from your PDF bill, utility email, or OCR scan..."
            className="w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:bg-white transition-colors font-mono-tabular leading-relaxed"
          />
        </div>
      )}

      {fileError && (
        <p className="text-xs text-[#DC2626] font-medium" role="alert">
          {fileError}
        </p>
      )}

      {/* Optional Previous Month Bill Slot */}
      <div className="border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => onTogglePreviousSlot(!showPreviousSlot)}
          aria-expanded={showPreviousSlot}
          className="w-full flex items-center justify-between text-left text-sm font-medium text-[#0F172A] hover:text-[#0F766E] transition-colors cursor-pointer"
        >
          <span>Add Previous Month&apos;s Bill (Optional)</span>
          {showPreviousSlot ? (
            <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          )}
        </button>
        <p className="mt-1 text-xs text-slate-500">
          Helpful if your current bill doesn&apos;t print last month&apos;s kWh or history chart.
        </p>

        {showPreviousSlot && (
          <div className="mt-3.5 space-y-3">
            <input
              ref={previousFileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="sr-only"
              onChange={(e) => {
                handleFileSelection(e.target.files?.[0], true);
                e.target.value = '';
              }}
            />

            {!previousFile ? (
              <button
                type="button"
                onClick={() => previousFileInputRef.current?.click()}
                className="w-full px-3.5 py-2.5 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Attach Previous Bill File (Image or PDF)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-[#F8FAFC]">
                <span className="text-xs font-medium text-[#0F172A] truncate">
                  {previousFile.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => onPreviousFileChange(null)}
                  aria-label="Remove previous bill file"
                  className="p-1 text-slate-500 hover:text-[#0F172A] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label htmlFor="previous-bill-text" className="block text-xs text-slate-600 mb-1">
                Or paste previous bill text
              </label>
              <textarea
                id="previous-bill-text"
                rows={3}
                value={previousText}
                onChange={(e) => onPreviousTextChange(e.target.value)}
                placeholder="Optional: paste last month's kWh & amount..."
                className="w-full rounded-lg border border-slate-300 bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:bg-white transition-colors font-mono-tabular"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Action */}
      <button
        type="button"
        disabled={!canAnalyze}
        onClick={() => onAnalyze()}
        className="w-full py-2.5 px-5 rounded-lg text-sm font-semibold text-white bg-[#0F766E] hover:bg-[#0D625B] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>Analyzing Bill...</span>
          </>
        ) : (
          <span>Explain My Bill</span>
        )}
      </button>

      {/* Sample Presets */}
      <div className="border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold text-slate-700 mb-2.5">
          Try a sample bill
        </p>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {SAMPLE_BILL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={isAnalyzing}
              onClick={() => onSelectSample(preset)}
              className="w-full text-left px-3.5 py-3 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#0F172A]">
                  {preset.title}
                </span>
                <span className="text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                  {preset.regionLabel}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
