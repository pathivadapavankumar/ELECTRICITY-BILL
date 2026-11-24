import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import type { AnalyzeBillRequest, BillAnalysis, BillInputPayload } from './src/types/bill.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const SYSTEM_INSTRUCTION = `You are an expert Utility & Energy Analyst for a "Smart Electricity Bill Explainer" app. Your job is to analyze an uploaded electricity bill (image, PDF, or raw OCR text) — and an optional previous month's bill if provided — and explain it to an everyday consumer in clear, simple, jargon-free language.

CORE TASKS:
1. Extract Key Data: Accurately pull the billing period, total amount due, due date, current units consumed (kWh / Units), previous month's units (if shown on the bill, historical bar chart, or optional previous bill), tariff category, utility provider, and every itemized charge.
2. Explain Charges Simply: Break down every line item (e.g., Fixed Charges, Energy Charges, Wheeling Charges, Fuel Adjustment/FPPCA/FAC, Electricity Duty, Meter Rent, Subsidies/Credits, Taxes, Arrears). Translate technical utility jargon into plain, 1-sentence explanations of what the user is actually paying for.
3. Compare Monthly Consumption: Compare the current billing cycle's unit consumption and total cost against the previous month (from the bill's history/bar chart or the attached previous bill). Calculate the exact unit difference (Current - Previous) and exact percentage change ((Current - Previous) / Previous * 100), rounded to 1 decimal place. Include numeric values in lastMonthNumericUnits and thisMonthNumericUnits when readable.
4. Identify Unusual Increases (Anomaly Detection): Flag any spike in consumption (e.g., >15% increase), jump into a higher tariff slab, sudden surcharges, arrears, late fees, or abnormal fixed-fee changes. Classify status strictly as one of: "Normal Usage", "Moderate Increase", or "High Spike Alert". Suggest 2-3 practical, likely causes and 1 concrete actionable tip to lower the next bill.

STRICT GUARDRAILS:
- Zero Hallucination: Never guess or invent numbers. If previous month data or specific sub-charges are blurred, cut off, or missing from the uploaded bill, explicitly write "Not visible on bill" for those fields, set isAvailable to false (and numeric units to null if missing), and ask the user in the verdict to upload their previous bill for comparison.
- Tone: Helpful, calm, transparent, and easy to understand for someone with zero technical or electrical background.
- Currency & Units: Match the exact currency symbol (e.g., ₹, $, €, £) and unit measurement (kWh / Units) printed on the document.
- Meter Reading Status: Return "Actual", "Estimated", or "Not Mentioned" (or exact wording if clearly stated as Actual/Estimated).`;

const BILL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        billingPeriod: { type: Type.STRING, description: 'Start Date – End Date, or "Not visible on bill"' },
        totalAmountDue: { type: Type.STRING, description: 'Exact currency symbol + amount, or "Not visible on bill"' },
        dueDate: { type: Type.STRING, description: 'Payment due date, or "Not visible on bill"' },
        totalUnitsConsumed: { type: Type.STRING, description: 'Current units consumed with unit label (e.g., "428 kWh"), or "Not visible on bill"' },
        meterReadingStatus: { type: Type.STRING, description: '"Actual", "Estimated", or "Not Mentioned"' },
        tariffCategory: { type: Type.STRING, description: 'Tariff category or rate schedule, or "Not visible on bill"' },
        utilityProvider: { type: Type.STRING, description: 'Utility company name, or "Not visible on bill"' },
        currencySymbol: { type: Type.STRING, description: 'Exact currency symbol from the bill (e.g., "₹", "$", "€")' },
        unitLabel: { type: Type.STRING, description: 'Exact unit label from the bill (e.g., "kWh", "Units")' },
      },
      required: [
        'billingPeriod',
        'totalAmountDue',
        'dueDate',
        'totalUnitsConsumed',
        'meterReadingStatus',
        'tariffCategory',
        'utilityProvider',
        'currencySymbol',
        'unitLabel',
      ],
    },
    chargeBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          chargeName: { type: Type.STRING, description: 'Exact charge name as printed on the bill' },
          amount: { type: Type.STRING, description: 'Exact currency + amount printed for this line item, or "Not visible on bill"' },
          plainExplanation: { type: Type.STRING, description: 'Simple 1-sentence jargon-free explanation of what this pays for' },
        },
        required: ['chargeName', 'amount', 'plainExplanation'],
      },
    },
    monthOverMonth: {
      type: Type.OBJECT,
      properties: {
        isAvailable: { type: Type.BOOLEAN, description: 'True if previous month units were found on the bill or attached previous bill' },
        lastMonthUnits: { type: Type.STRING, description: 'Previous month units with unit label, or "Not visible on bill"' },
        lastMonthAmount: { type: Type.STRING, description: 'Previous month billed amount with currency, or "Not visible on bill"' },
        lastMonthNumericUnits: { type: Type.NUMBER, nullable: true, description: 'Numeric value of previous month units, or null if not visible' },
        thisMonthUnits: { type: Type.STRING, description: 'Current month units with unit label, or "Not visible on bill"' },
        thisMonthAmount: { type: Type.STRING, description: 'Current month billed amount with currency, or "Not visible on bill"' },
        thisMonthNumericUnits: { type: Type.NUMBER, nullable: true, description: 'Numeric value of current month units, or null if not visible' },
        unitDifference: { type: Type.STRING, description: 'Signed difference e.g. "+143 kWh" or "-25 kWh", or "Not visible on bill"' },
        percentageChange: { type: Type.STRING, description: 'Signed percentage e.g. "+50.2%" or "-8.1%", or "Not visible on bill"' },
        verdict: { type: Type.STRING, description: '1-2 calm sentences summarizing change, or politely asking user to upload previous bill if unavailable' },
      },
      required: [
        'isAvailable',
        'lastMonthUnits',
        'lastMonthAmount',
        'lastMonthNumericUnits',
        'thisMonthUnits',
        'thisMonthAmount',
        'thisMonthNumericUnits',
        'unitDifference',
        'percentageChange',
        'verdict',
      ],
    },
    spikeAlerts: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ['Normal Usage', 'Moderate Increase', 'High Spike Alert'],
          description: 'Overall anomaly classification',
        },
        whatChanged: { type: Type.STRING, description: 'Specific anomalies found (slab jump, >15% spike, arrears, estimated read, surcharges)' },
        likelyReasons: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2-3 realistic, practical reasons for the spike or bill pattern',
        },
        actionableTip: { type: Type.STRING, description: 'One practical, everyday tip to reduce the next bill' },
      },
      required: ['status', 'whatChanged', 'likelyReasons', 'actionableTip'],
    },
  },
  required: ['summary', 'chargeBreakdown', 'monthOverMonth', 'spikeAlerts'],
};

function buildMarkdownReport(data: Omit<BillAnalysis, 'markdownReport'>): string {
  const { summary, chargeBreakdown, monthOverMonth, spikeAlerts } = data;

  const breakdownRows =
    chargeBreakdown.length > 0
      ? chargeBreakdown
          .map(
            (item) =>
              `| ${item.chargeName.replace(/\|/g, '/')} | ${item.amount.replace(/\|/g, '/')} | ${item.plainExplanation.replace(/\|/g, '/')} |`
          )
          .join('\n')
      : '| Not visible on bill | Not visible on bill | Itemized charges could not be read from the uploaded document. |';

  const lastMonthLine =
    monthOverMonth.lastMonthAmount && monthOverMonth.lastMonthAmount !== 'Not visible on bill'
      ? `${monthOverMonth.lastMonthUnits} (${monthOverMonth.lastMonthAmount})`
      : `${monthOverMonth.lastMonthUnits} *(Previous bill amount not visible on bill)*`;

  const thisMonthLine = `${monthOverMonth.thisMonthUnits} (${monthOverMonth.thisMonthAmount})`;

  const reasonsText = spikeAlerts.likelyReasons.map((r) => `  * ${r}`).join('\n');

  return `#### 1. Quick Bill Summary
* **Billing Period:** ${summary.billingPeriod}
* **Total Amount Due:** ${summary.totalAmountDue} (Due by: ${summary.dueDate})
* **Total Units Consumed:** ${summary.totalUnitsConsumed}
* **Meter Reading Status:** ${summary.meterReadingStatus}

#### 2. Plain-Language Charge Breakdown
| Charge Name on Bill | Amount | What This Actually Means |
| :--- | :--- | :--- |
${breakdownRows}

#### 3. Month-over-Month Comparison
* **Last Month:** ${lastMonthLine}
* **This Month:** ${thisMonthLine}
* **Difference:** ${monthOverMonth.unitDifference} (${monthOverMonth.percentageChange})
* **Verdict:** ${monthOverMonth.verdict}

#### 4. Unusual Increases & Spike Alerts
* **Status:** ${spikeAlerts.status}
* **What Changed:** ${spikeAlerts.whatChanged}
* **Likely Reasons & Actionable Tip:**
${reasonsText}
  * **Quick Tip:** ${spikeAlerts.actionableTip}`;
}

function buildPartsFromBill(label: string, bill: BillInputPayload) {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  parts.push({ text: `--- ${label} ---` });

  if (bill.fileData && bill.fileData.base64) {
    const normalizedMime = bill.fileData.mimeType === 'image/jpg' ? 'image/jpeg' : bill.fileData.mimeType;
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      throw new Error(`Unsupported file format (${bill.fileData.mimeType}). Please upload a PNG, JPG, WEBP, or PDF file.`);
    }
    const cleanBase64 = bill.fileData.base64.includes(',')
      ? bill.fileData.base64.split(',')[1]
      : bill.fileData.base64;

    parts.push({
      inlineData: {
        mimeType: normalizedMime,
        data: cleanBase64,
      },
    });
  }

  if (bill.rawText && bill.rawText.trim().length > 0) {
    parts.push({ text: `Raw OCR / Bill Text:\n${bill.rawText.trim()}` });
  }

  return parts;
}

async function generateWithRetry(
  ai: GoogleGenAI,
  contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  retries = 2
): Promise<GenerateContentResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts: contents },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: BILL_RESPONSE_SCHEMA,
        },
      });
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTransient =
        errMsg.includes('500') ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('ECONNRESET');
      if (!isTransient || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 750 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-bill', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(500).json({
        error:
          'Gemini API key is not configured. Please check your GEMINI_API_KEY in the Settings > Secrets panel.',
      });
      return;
    }

    const body = req.body as AnalyzeBillRequest | undefined;
    if (!body || !body.currentBill) {
      res.status(400).json({ error: 'Please upload a bill image, PDF, or paste bill text to analyze.' });
      return;
    }

    const hasCurrentFile = Boolean(body.currentBill.fileData?.base64);
    const hasCurrentText = Boolean(body.currentBill.rawText?.trim());
    if (!hasCurrentFile && !hasCurrentText) {
      res.status(400).json({ error: 'Current electricity bill input is empty.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        ...buildPartsFromBill('CURRENT ELECTRICITY BILL', body.currentBill),
      ];

      const hasPreviousFile = Boolean(body.previousBill?.fileData?.base64);
      const hasPreviousText = Boolean(body.previousBill?.rawText?.trim());
      if (body.previousBill && (hasPreviousFile || hasPreviousText)) {
        parts.push(...buildPartsFromBill('PREVIOUS MONTH ELECTRICITY BILL (FOR COMPARISON)', body.previousBill));
      }

      parts.push({
        text: 'Analyze the provided electricity bill(s) carefully. Extract all visible numbers accurately without guessing, explain every itemized charge in 1 plain sentence, compute exact month-over-month differences if prior data is visible, and flag any unusual spikes or tariff jumps.',
      });

      const response = await generateWithRetry(ai, parts);
      const rawJson = (response.text ?? '').trim();
      if (!rawJson) {
        res.status(502).json({ error: 'Received an empty analysis response. Please try again.' });
        return;
      }

      const parsed = JSON.parse(rawJson) as Omit<BillAnalysis, 'markdownReport'>;
      const fullResult: BillAnalysis = {
        ...parsed,
        markdownReport: buildMarkdownReport(parsed),
      };

      res.json(fullResult);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to analyze electricity bill.';
      const lower = message.toLowerCase();

      if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
        res.status(403).json({
          error: 'API key permission issue. Please verify your Gemini API key in the Settings > Secrets panel.',
        });
        return;
      }
      if (lower.includes('resource_exhausted') || lower.includes('429')) {
        res.status(429).json({
          error: 'Usage quota reached for now. Please wait a moment and try again, or check your billing tier in Settings > Secrets.',
        });
        return;
      }
      if (lower.includes('not_found') || lower.includes('404')) {
        res.status(404).json({
          error: 'Analysis model could not be reached. Please try again shortly.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
