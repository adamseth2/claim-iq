// Generates the six synthetic seed documents for the ClaimIQ demo.
// Output: server/seed/out/*.pdf and *.xlsx
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildPdf } from './pdf.mjs';
import { buildXlsx } from './xlsx.mjs';
import { buildPopulation } from './population.mjs';
import { agreementPages, amendmentPages } from './contracts.mjs';
import {
  COMPANY,
  SUPPLIER,
  SIGNAL,
  CONTRACT,
  ENGINEERING,
  REP_CLAIM,
  CONTRACT_ID,
  SUPPORTED_CLAIMS,
  SUPPORTED_TOTAL,
  COVERED_LOTS,
} from './facts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
mkdirSync(OUT, { recursive: true });

const FOOTER = 'SYNTHETIC DEMONSTRATION DOCUMENT — fictional. Not a real agreement or legal instrument.';

// 1. Supply Agreement (detailed, multi-page)
writeFileSync(join(OUT, `Atlas_PSU_Supply_Agreement_${CONTRACT_ID}.pdf`), buildPdf(agreementPages()));

// 2. Amendment No. 1 (adds AP-750R2)
writeFileSync(join(OUT, `Atlas_PSU_Amendment_01_${CONTRACT_ID}.pdf`), buildPdf(amendmentPages()));

// 3. Warranty Trend Report
const trend = buildPdf([
  {
    title: `${SIGNAL.id} Warranty Trend Report`,
    lines: [
      `Signal: ${SIGNAL.title}`,
      `As of: ${SIGNAL.asOf}`,
      '',
      `Current 30-day window: ${SIGNAL.currentWindow.from} to ${SIGNAL.currentWindow.to}.`,
      `Qualifying claims in current window: ${SIGNAL.current30dClaims}.`,
      '',
      `Historical baseline window: ${SIGNAL.baselineWindow.from} to ${SIGNAL.baselineWindow.to}.`,
      `Historical qualifying claims: ${SIGNAL.baselineTotal} across ${SIGNAL.baselinePeriods} periods.`,
      `Historical average per 30 days: ${SIGNAL.baselineAvg}.`,
      `Observed ratio: ${SIGNAL.ratioText} baseline.`,
      '',
      'Signal policy:',
      '  1. Product model is R500.',
      '  2. Replaced component is PSU-750.',
      `  3. Structured failure code is in group ${SIGNAL.failureGroup}.`,
      '  4. At least 15 qualifying completed claims occur in 30 days.',
      '  5. Current count is at least 2.5x the historical 30-day average.',
      '',
      'This signal indicates that claim activity warrants investigation.',
      'It does not establish a defect or supplier responsibility.',
      '',
      FOOTER,
    ],
  },
]);
writeFileSync(join(OUT, `${SIGNAL.id}_Warranty_Trend_Report.pdf`), trend);

// 4. Engineering Report
const engineering = buildPdf([
  {
    title: `${SIGNAL.id} R500 PSU Engineering Report`,
    lines: [
      `Report ID: ${ENGINEERING.reportId}`,
      `Status: ${ENGINEERING.approved ? 'Approved' : 'Draft'}`,
      '',
      `Component: ${ENGINEERING.component} (supplier part ${ENGINEERING.supplierPart}).`,
      `Returned-part sample size: ${ENGINEERING.sampleSize}.`,
      `Frozen applicable supplier lots: ${ENGINEERING.lots.join(', ')}.`,
      `Frozen date range: ${ENGINEERING.dateRange.from} to ${ENGINEERING.dateRange.to}.`,
      `Frozen failure code group: ${ENGINEERING.failureGroup}.`,
      '',
      'Conclusion:',
      `  ${ENGINEERING.conclusion}`,
      '',
      FOOTER,
    ],
  },
]);
writeFileSync(join(OUT, `${SIGNAL.id}_R500_PSU_Engineering_Report.pdf`), engineering);

// 5. Traceability Matrix (xlsx)
const pop = buildPopulation();
const header = [
  'Claim ID',
  'Product',
  'Product Serial',
  'Component',
  'Component Serial',
  'Supplier Part',
  'Supplier Lot',
  'Delivery Receipt',
  'Repair Date',
  'Failure Code',
  'Evidence State',
  'Cost (USD)',
  'Classification',
];
const matrixRows = [
  header,
  ...pop.map((r) => [
    r.claimId,
    r.product,
    r.productSerial,
    r.component,
    r.componentSerial,
    r.supplierPart,
    r.supplierLot,
    r.deliveryReceipt,
    r.repairDate,
    r.failureCode,
    r.evidenceState,
    String(r.cost),
    r.classification,
  ]),
];
writeFileSync(join(OUT, `${SIGNAL.id}_Traceability_Matrix.xlsx`), buildXlsx(matrixRows));

// 6. Representative Claim Evidence Packet
const packet = buildPdf([
  {
    title: `${REP_CLAIM.claimId} Evidence Packet`,
    lines: [
      'Occurrence summary: Customer reported R500 server no-power condition.',
      '  Field repair replaced the PSU-750 power supply. Repair completed.',
      '',
      'Component and supplier traceability:',
      `  Product: ${REP_CLAIM.product}`,
      `  Component: ${REP_CLAIM.component}`,
      `  Component serial: ${REP_CLAIM.componentSerial}`,
      `  Supplier part: ${REP_CLAIM.supplierPart}`,
      `  Supplier lot: ${REP_CLAIM.supplierLot}`,
      `  Delivery receipt: ${REP_CLAIM.deliveryReceipt}`,
      `  Repair completed: ${REP_CLAIM.repairCompleted}`,
      `  Filing due: ${REP_CLAIM.filingDue}`,
      '',
      'Cost:',
      `  Verified replacement-part cost: $${REP_CLAIM.verifiedPartCost}`,
      `  Contract cap: $${REP_CLAIM.contractCap}`,
      `  Proposed amount: min($${REP_CLAIM.verifiedPartCost}, $${REP_CLAIM.contractCap}) = $${REP_CLAIM.proposedAmount}`,
      '',
      `[Component-label image placeholder — lot ${REP_CLAIM.supplierLot}]`,
      '',
      `Reference: approved population-level report ${ENGINEERING.reportId}`,
      `  applicable lots ${COVERED_LOTS.join(', ')}.`,
      '',
      `This claim is one of ${SUPPORTED_CLAIMS} evidence-supported claims`,
      `  contributing to the $${SUPPORTED_TOTAL} potential recovery pending human validation.`,
      '',
      FOOTER,
    ],
  },
]);
writeFileSync(join(OUT, `${REP_CLAIM.claimId}_Evidence_Packet.pdf`), packet);

console.log('Generated 6 seed documents in', OUT);
for (const f of [
  `Atlas_PSU_Supply_Agreement_${CONTRACT_ID}.pdf`,
  `Atlas_PSU_Amendment_01_${CONTRACT_ID}.pdf`,
  `${SIGNAL.id}_Warranty_Trend_Report.pdf`,
  `${SIGNAL.id}_R500_PSU_Engineering_Report.pdf`,
  `${SIGNAL.id}_Traceability_Matrix.xlsx`,
  `${REP_CLAIM.claimId}_Evidence_Packet.pdf`,
]) {
  console.log('  -', f);
}
