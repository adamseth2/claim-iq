// Generates the six synthetic seed documents for the ClaimIQ demo.
// Output: server/seed/out/*.pdf and *.xlsx
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { buildPdf as buildNativePdf } from './pdf.mjs';
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
const { values } = parseArgs({ options: {
  renderer: { type: 'string', default: 'native' },
  output: { type: 'string', default: join(__dirname, 'out') },
  python: { type: 'string', default: process.env.CLAIMIQ_PYTHON || (process.platform === 'win32' ? 'python' : 'python3') },
} });
if (!['native', 'reportlab'].includes(values.renderer)) {
  throw new Error('Renderer must be native or reportlab.');
}
if (values.renderer === 'reportlab') {
  const check = spawnSync(values.python, ['-c', 'import reportlab'], { encoding: 'utf8' });
  if (check.error || check.status !== 0) {
    throw new Error('ReportLab is unavailable. Install server/seed/requirements.txt and set CLAIMIQ_PYTHON or --python. No fallback renderer was selected.');
  }
}
const OUT = resolve(values.output);
mkdirSync(OUT, { recursive: true });
const artifacts = [];
function buildPdf(pages) {
  if (values.renderer === 'native') return buildNativePdf(pages);
  const result = spawnSync(values.python, [join(__dirname, 'render_documents.py')], {
    input: JSON.stringify({ pages }), maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`ReportLab rendering failed: ${result.error?.message || result.stderr.toString().trim()}`);
  }
  return result.stdout;
}
function writeArtifact(path, content) {
  writeFileSync(path, content);
  artifacts.push({ name: basename(path), bytes: content.length,
    sha256: createHash('sha256').update(content).digest('hex') });
}

const FOOTER = 'SYNTHETIC DEMONSTRATION DOCUMENT - fictional. Not a real agreement or legal instrument.';

// 1. Supply Agreement (current detailed multi-page contract)
writeArtifact(join(OUT, `Atlas_PSU_Supply_Agreement_${CONTRACT_ID}.pdf`), buildPdf(agreementPages()));

// 2. Amendment No. 1 (current AP-750R2 coverage terms)
writeArtifact(join(OUT, `Atlas_PSU_Amendment_01_${CONTRACT_ID}.pdf`), buildPdf(amendmentPages()));

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
writeArtifact(join(OUT, `${SIGNAL.id}_Warranty_Trend_Report.pdf`), trend);

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
writeArtifact(join(OUT, `${SIGNAL.id}_R500_PSU_Engineering_Report.pdf`), engineering);

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
writeArtifact(join(OUT, `${SIGNAL.id}_Traceability_Matrix.xlsx`), buildXlsx(matrixRows));

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
      `[SYNTHETIC PLACEHOLDER ONLY - no photograph supplied - lot ${REP_CLAIM.supplierLot}]`,
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
writeArtifact(join(OUT, `${REP_CLAIM.claimId}_Evidence_Packet.pdf`), packet);

// A local provenance record, not Box evidence or a claim of human review.
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({
  schemaVersion: 1, synthetic: true, renderer: values.renderer,
  signalId: SIGNAL.id, asOf: SIGNAL.asOf, supportedClaims: SUPPORTED_CLAIMS,
  potentialRecovery: SUPPORTED_TOTAL, financialActionAuthorized: false,
  documents: artifacts,
}, null, 2) + '\n');
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
