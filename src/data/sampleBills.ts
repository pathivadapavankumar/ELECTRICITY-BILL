import type { SampleBillPreset } from '../types/bill';

export const SAMPLE_BILL_PRESETS: SampleBillPreset[] = [
  {
    id: 'residential-spike',
    title: 'Summer AC Spike & Slab Jump',
    regionLabel: 'MSEDCL · Residential (₹)',
    description: '428 kWh bill showing a jump past the 300-unit tariff slab plus FPPCA fuel surcharge.',
    rawText: `MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.
ELECTRICITY BILL - RESIDENTIAL (LT-I BPL/GENERAL)
Consumer No: 170049281722 | Tariff Category: LT-1A Residential (Single Phase)
Billing Period: 01 Oct 2026 to 31 Oct 2026
Bill Date: 03 Nov 2026 | Due Date: 18 Nov 2026
Meter Reading Status: ACTUAL
Previous Reading: 14,210 kWh | Current Reading: 14,638 kWh
Total Units Consumed: 428 kWh

MONTHLY CONSUMPTION HISTORY:
Sep 2026: 285 kWh (Bill Amount: ₹2,190.00)
Oct 2026: 428 kWh (Current Month)

ITEMIZED BILLING DETAILS:
1. Fixed / Demand Charges (1 Phase): ₹128.00
2. Energy Charges:
   - Slab 0-100 units @ ₹4.71/unit: ₹471.00
   - Slab 101-300 units @ ₹10.29/unit: ₹2,058.00
   - Slab 301-500 units (128 units @ ₹14.55/unit): ₹1,862.40
   Total Energy Charges: ₹4,391.40
3. Wheeling Charges (428 units @ ₹1.17/unit): ₹500.76
4. Fuel Adjustment Charge (FAC / FPPCA): ₹342.40
5. Electricity Duty (16% on Energy + Fixed + Wheeling): ₹803.22
6. Tax on Sale of Electricity (TOSE @ ₹0.19/unit): ₹81.32
7. Prompt Payment Discount (if paid by 10 Nov): -₹45.00 (Not yet applied)

NET AMOUNT PAYABLE BY DUE DATE: ₹6,247.10`,
  },
  {
    id: 'us-tou-utility',
    title: 'Time-of-Use & Delivery Fees',
    regionLabel: 'Pacific Grid · Residential ($)',
    description: 'US utility statement splitting electric generation, delivery, and state energy surcharges.',
    rawText: `PACIFIC METRO ELECTRIC & GAS
STATEMENT OF ACCOUNT — SERVICE PERIOD: 09/15/2026 - 10/14/2026 (30 Days)
Rate Schedule: E-TOU-C Residential Time-of-Use
Meter Status: Actual Smart Meter Read
Due Date: 11/04/2026
Total Electric Charges Due: $214.68

USAGE SUMMARY:
Prior Month (Aug 15 - Sep 14, 2026): 580 kWh — Total Billed: $198.40
Current Month (Sep 15 - Oct 14, 2026): 612 kWh — Peak: 194 kWh | Off-Peak: 418 kWh

CHARGES BREAKDOWN:
- Basic Service Charge (30 days @ $0.38/day): $11.40
- Electric Delivery Charges (Distribution & Transmission, 612 kWh): $94.25
- Peak Generation Charge (4pm-9pm, 194 kWh @ $0.24/kWh): $46.56
- Off-Peak Generation Charge (418 kWh @ $0.12/kWh): $50.16
- Wildfire Fund / Public Purpose Programs Charge: $9.18
- State & Municipal Utility User Tax: $7.43
- California Climate Credit (Semi-Annual Rebate): -$4.30

TOTAL AMOUNT DUE: $214.68`,
  },
  {
    id: 'estimated-arrears',
    title: 'Estimated Read & Arrears',
    regionLabel: 'Metro Power · Residential (€)',
    description: 'Bill with an estimated meter reading, unpaid previous balance, and no prior month kWh chart.',
    rawText: `METRO POWER SUPPLY — DOMESTIC ELECTRICITY STATEMENT
Account: MP-884120 | Tariff: Standard Urban Domestic (24h)
Billing Period: 01/10/2026 - 31/10/2026
Payment Due Date: 14/11/2026
Meter Reading Type: ESTIMATED (Meter inaccessible on inspection date)
Units Billed This Period: 340 kWh

CHARGES FOR THIS PERIOD:
- Standing Charge (31 days @ €0.62/day): €19.22
- Unit Energy Rate (340 kWh @ €0.285/kWh): €96.90
- PSO Levy (Public Service Obligation): €3.23
- Meter Rental Fee: €2.50
- VAT (9%): €10.97
- Previous Balance Brought Forward (Arrears): €48.50
- Late Payment Interest: €1.85

TOTAL AMOUNT DUE: €183.17`,
  },
];
