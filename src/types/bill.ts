export type SpikeStatus = 'Normal Usage' | 'Moderate Increase' | 'High Spike Alert';

export interface BillSummary {
  billingPeriod: string;
  totalAmountDue: string;
  dueDate: string;
  totalUnitsConsumed: string;
  meterReadingStatus: string;
  tariffCategory: string;
  utilityProvider: string;
  currencySymbol: string;
  unitLabel: string;
}

export interface ChargeLineItem {
  chargeName: string;
  amount: string;
  plainExplanation: string;
}

export interface MonthOverMonthComparison {
  isAvailable: boolean;
  lastMonthUnits: string;
  lastMonthAmount: string;
  lastMonthNumericUnits: number | null;
  thisMonthUnits: string;
  thisMonthAmount: string;
  thisMonthNumericUnits: number | null;
  unitDifference: string;
  percentageChange: string;
  verdict: string;
}

export interface SpikeAlertAnalysis {
  status: SpikeStatus;
  whatChanged: string;
  likelyReasons: string[];
  actionableTip: string;
}

export interface BillAnalysis {
  summary: BillSummary;
  chargeBreakdown: ChargeLineItem[];
  monthOverMonth: MonthOverMonthComparison;
  spikeAlerts: SpikeAlertAnalysis;
  markdownReport: string;
}

export interface BillInputPayload {
  fileData?: {
    mimeType: string;
    base64: string;
    fileName: string;
  };
  rawText?: string;
}

export interface AnalyzeBillRequest {
  currentBill: BillInputPayload;
  previousBill?: BillInputPayload;
}

export interface SampleBillPreset {
  id: string;
  title: string;
  regionLabel: string;
  description: string;
  rawText: string;
}
