// Canonical synthetic facts for the ClaimIQ Recovery demo.
// Single source of truth for the six seed documents and their Box metadata.
// All values are fictional. Never represents real suppliers, prices, or data.

export const COMPANY = 'Northstar Infrastructure Systems';
export const SUPPLIER = 'Atlas Power Components';
export const SUPPLIER_ID = 'SUP-ATLAS';
export const SIGNAL_ID = 'SIG-2026-009';
export const INVESTIGATION_ID = 'SI-2026-014';
export const CONTRACT_ID = 'APC-2025-017';

export const PRODUCT_MODEL = 'R500';
export const OEM_PART = 'PSU-750';
export const SUPPLIER_PART = 'AP-750R2';

export const PER_UNIT_CAP = 650;
export const VERIFIED_PART_COST = 620;
export const SUPPORTED_CLAIMS = 24;
export const SUPPORTED_TOTAL = SUPPORTED_CLAIMS * VERIFIED_PART_COST; // 14880

export const SIGNAL = {
  id: SIGNAL_ID,
  title: 'Elevated R500 no-power repairs',
  currentWindow: { from: '2026-09-18', to: '2026-10-17' },
  current30dClaims: 19,
  baselineWindow: { from: '2026-03-22', to: '2026-09-17' },
  baselineTotal: 36,
  baselinePeriods: 6,
  baselineAvg: 6,
  ratioText: '3.17x',
  asOf: '2026-10-17 12:00 PM America/Los_Angeles',
  failureGroup: 'NO-POWER-v1',
};

export const CLASSIFICATION = {
  evidenceSupported: 24,
  missingTraceability: 15,
  engineeringReview: 6,
  excluded: 3,
  total: 48,
};

export const CONTRACT = {
  agreementId: CONTRACT_ID,
  supplier: SUPPLIER,
  coveredOemPart: OEM_PART,
  coveredSupplierPart: SUPPLIER_PART,
  warrantyMonths: 24,
  recoverableCost: 'verified replacement-part cost',
  perUnitCap: PER_UNIT_CAP,
  laborExcluded: true,
  shippingExcluded: true,
  filingWindowDays: 90,
  effectiveDate: '2025-04-01',
};

export const REP_CLAIM = {
  claimId: 'WR-10482',
  product: PRODUCT_MODEL,
  component: OEM_PART,
  componentSerial: 'NS-PSU-10482',
  supplierPart: SUPPLIER_PART,
  supplierLot: 'ATL-24-118',
  deliveryReceipt: 'RCV-250118-04',
  repairCompleted: '2026-09-20',
  filingDue: '2026-12-19',
  verifiedPartCost: VERIFIED_PART_COST,
  contractCap: PER_UNIT_CAP,
  proposedAmount: Math.min(VERIFIED_PART_COST, PER_UNIT_CAP), // 180
};

// Supplier lots covered by the frozen engineering-report applicability.
export const COVERED_LOTS = ['ATL-24-116', 'ATL-24-118', 'ATL-24-121'];

export const ENGINEERING = {
  reportId: 'ER-2026-048',
  component: OEM_PART,
  supplierPart: SUPPLIER_PART,
  lots: COVERED_LOTS,
  dateRange: { from: '2026-07-20', to: '2026-10-17' },
  failureGroup: 'NO-POWER-v1',
  conclusion:
    'Returned-part sample analysis indicates a supplier-attributable input-capacitor ' +
    'failure mode for the specified lots. Population-level causation applies only to ' +
    'claims matching the frozen component, supplier-lot, date-range, and failure-code criteria.',
  sampleSize: 12,
  approved: true,
};
