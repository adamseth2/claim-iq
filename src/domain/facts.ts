// Canonical synthetic facts + domain types for the ClaimIQ Recovery app.
// Mirrors server/seed/facts.mjs. All values are fictional.

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

export const DATASET_PERIOD = { from: '2025-10-18', to: '2026-10-17' };
export const AS_OF = '2026-10-17 12:00 PM America/Los_Angeles';
export const TOTAL_CLAIMS = 12480;

export const FAILURE_NO_POWER = 'NO-POWER-v1';

export type Classification =
  | 'supported'
  | 'missing'
  | 'engineering'
  | 'excluded';

export interface Claim {
  claimId: string;
  productModel: string;
  productSerial: string;
  component: string; // replaced component, e.g. PSU-750 (or '' if not a PSU replacement)
  componentSerial: string;
  supplierPart: string;
  supplierLot: string;
  deliveryReceipt: string;
  repairDate: string; // ISO yyyy-mm-dd
  failureCode: string;
  isAtlasMapped: boolean;
  evidenceState: string;
  cost: number;
  /** Set only for the 48-claim investigation population. */
  classification?: Classification;
}

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
  threshold: 2.5,
  minQualifying: 15,
  asOf: AS_OF,
  failureGroup: FAILURE_NO_POWER,
  candidateComponent: OEM_PART,
  candidateSupplier: SUPPLIER,
} as const;

export const CLASSIFICATION_COUNTS = {
  supported: 24,
  missing: 15,
  engineering: 6,
  excluded: 3,
  total: 48,
} as const;

export const FUNNEL = {
  completedClaims: 12480,
  r500Claims: 642,
  noPowerClaims: 94,
  psuReplacements: 71,
  atlasMapped: 48,
  supported: 24,
} as const;

export const INVESTIGATION_SCOPE = { from: '2026-07-20', to: '2026-10-17' };

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
} as const;

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
  proposedAmount: Math.min(VERIFIED_PART_COST, PER_UNIT_CAP),
} as const;

export const COVERED_LOTS = ['ATL-24-116', 'ATL-24-118', 'ATL-24-121'] as const;

export const ENGINEERING = {
  reportId: 'ER-2026-048',
  component: OEM_PART,
  supplierPart: SUPPLIER_PART,
  lots: COVERED_LOTS,
  dateRange: INVESTIGATION_SCOPE,
  failureGroup: FAILURE_NO_POWER,
  conclusion:
    'Returned-part sample analysis indicates a supplier-attributable input-capacitor ' +
    'failure mode for the specified lots. Population-level causation applies only to ' +
    'claims matching the frozen component, supplier-lot, date-range, and failure-code criteria.',
  sampleSize: 12,
  approved: true,
} as const;
