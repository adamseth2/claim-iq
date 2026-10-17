// Deterministic 12,480-claim synthetic fixture.
//
// The fixture is built so the population funnel reconciles exactly:
//   12,480 completed claims
//     -> 642 R500 claims
//       -> 94 no-power claims
//         -> 71 PSU-750 replacements
//           -> 48 Atlas-mapped claims (the investigation population)
//             -> 24 evidence-supported
//
// A seeded PRNG keeps generation deterministic across runs/builds.
import {
  type Claim,
  type Classification,
  PRODUCT_MODEL,
  OEM_PART,
  SUPPLIER_PART,
  FAILURE_NO_POWER,
  COVERED_LOTS,
  VERIFIED_PART_COST,
  REP_CLAIM,
  FUNNEL,
  TOTAL_CLAIMS,
} from './facts';

// Mulberry32 seeded PRNG — deterministic.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OTHER_PRODUCTS = ['R300', 'R700', 'S200', 'T100', 'X900'];
const OTHER_COMPONENTS = ['FAN-220', 'HDD-4T', 'RAM-32', 'NIC-10G', 'MB-R5'];
const OTHER_FAILURES = ['THERMAL-v1', 'DISK-v1', 'MEM-v1', 'NET-v1', 'BOOT-v1'];
const UNCOVERED_LOTS = ['ATL-24-109', 'ATL-23-540', 'GEN-UNK'];

function isoDate(rnd: () => number, fromY = 2025, fromM = 9, fromD = 18): string {
  // random day within the dataset period 2025-10-18 .. 2026-10-17 (365 days)
  const start = Date.UTC(fromY, fromM, fromD);
  const day = 86400000;
  const offset = Math.floor(rnd() * 365);
  return new Date(start + offset * day).toISOString().slice(0, 10);
}

const DAY = 86400000;
const isoFrom = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Deterministic date in the CURRENT 30-day signal window (2026-09-18..2026-10-17).
function currentWindowDate(k: number): string {
  return isoFrom(Date.UTC(2026, 8, 18) + ((k * 7) % 30) * DAY);
}

// Deterministic date in the two 30-day periods before the signal window.
// j in 0..28: 14 claims in 2026-07-20..2026-08-18, 15 in 2026-08-19..2026-09-17,
// giving an escalating 14 -> 15 -> 19 ramp across the 90-day scope.
function earlierScopeDate(j: number): string {
  if (j < 14) return isoFrom(Date.UTC(2026, 6, 20) + j * 2 * DAY);
  return isoFrom(Date.UTC(2026, 7, 19) + (j - 14) * 2 * DAY);
}

// Interleaved, deterministic classification order so claim IDs and dates are
// not grouped by outcome. Index 0 is supported (pinned to WR-10482).
function classificationOrder(): Classification[] {
  const pool: Classification[] = [
    ...Array<Classification>(24).fill('supported'),
    ...Array<Classification>(15).fill('missing'),
    ...Array<Classification>(6).fill('engineering'),
    ...Array<Classification>(3).fill('excluded'),
  ];
  const rnd = mulberry32(4820);
  const rest = pool.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [pool[0], ...rest];
}

/**
 * Builds the exactly-48 Atlas-mapped investigation population with the four
 * classifications (24 supported, 15 missing, 6 engineering, 3 excluded).
 */
export function buildInvestigationPopulation(): Claim[] {
  const rows: Claim[] = [];
  let n = 10600;
  let g = 0; // global ordinal across all classifications
  // Exactly this many population claims fall inside the current 30-day window,
  // producing the signal's qualifying count of 19.
  const IN_WINDOW = 19;

  const push = (classification: Classification, i: number) => {
    const claimId = `WR-${n++}`;
    const failure = FAILURE_NO_POWER;
    let lot: string;
    let evidenceState: string;
    // Supported claims carry the verified part cost (620). Non-supported claims
    // get varied, realistic costs — some above the 650 cap — so the cap is
    // visibly meaningful and the population does not look uniform. Only
    // supported claims enter the recovery total, so this does not affect $14,880.
    let cost = VERIFIED_PART_COST;

    if (classification === 'supported') {
      lot = COVERED_LOTS[i % COVERED_LOTS.length];
      evidenceState = 'Complete';
    } else if (classification === 'missing') {
      lot = '(none)';
      evidenceState = 'Missing supplier-lot';
      cost = [590, 640, 705, 620, 680][i % 5];
    } else if (classification === 'engineering') {
      lot = COVERED_LOTS[i % COVERED_LOTS.length];
      evidenceState = 'Engineering review';
      cost = [720, 610, 650][i % 3];
    } else {
      lot = COVERED_LOTS[i % COVERED_LOTS.length];
      // Excluded for a documented non-supplier cause (e.g. customer-induced
      // damage). Still a no-power PSU replacement, so it remains in the
      // no-power lineage of the funnel; exclusion is a review decision.
      evidenceState = 'Excluded (documented non-supplier cause)';
      cost = [480, 760, 620][i % 3];
    }

    const repairDate = g < IN_WINDOW ? currentWindowDate(g) : earlierScopeDate(g - IN_WINDOW);
    g += 1;

    rows.push({
      claimId,
      productModel: PRODUCT_MODEL,
      productSerial: `NS-R500-${claimId.slice(3)}`,
      component: OEM_PART,
      componentSerial: `NS-PSU-${claimId.slice(3)}`,
      supplierPart: SUPPLIER_PART,
      supplierLot: lot,
      deliveryReceipt:
        classification === 'missing' ? '(none)' : `RCV-2501${18 + (i % 9)}-0${(i % 7) + 1}`,
      repairDate,
      failureCode: failure,
      isAtlasMapped: true,
      evidenceState,
      cost,
      classification,
    });
  };

  const perClass: Record<Classification, number> = {
    supported: 0,
    missing: 0,
    engineering: 0,
    excluded: 0,
  };
  for (const c of classificationOrder()) push(c, perClass[c]++);

  // Pin the representative claim as the first supported row.
  rows[0] = {
    ...rows[0],
    claimId: REP_CLAIM.claimId,
    productSerial: `NS-R500-${REP_CLAIM.claimId.slice(3)}`,
    componentSerial: REP_CLAIM.componentSerial,
    supplierLot: REP_CLAIM.supplierLot,
    deliveryReceipt: REP_CLAIM.deliveryReceipt,
    repairDate: REP_CLAIM.repairCompleted,
    cost: REP_CLAIM.verifiedPartCost,
  };

  return rows;
}

let _cache: Claim[] | null = null;

/**
 * Returns the full deterministic 12,480-claim fixture.
 * Layer counts reconcile to the PRD funnel.
 */
export function buildFixture(): Claim[] {
  if (_cache) return _cache;
  const rnd = mulberry32(20261017);
  const claims: Claim[] = [];

  const population = buildInvestigationPopulation();
  const popIds = new Set(population.map((p) => p.claimId));

  // Layer target counts from the funnel.
  const r500Total = FUNNEL.r500Claims; // 642
  const noPower = FUNNEL.noPowerClaims; // 94
  const psuRepl = FUNNEL.psuReplacements; // 71
  const atlasMapped = FUNNEL.atlasMapped; // 48 (== population)

  // 1) The 48 Atlas-mapped PSU no-power R500 claims (the investigation population).
  claims.push(...population);

  // 2) PSU-750 replacements that are no-power R500 but NOT Atlas-mapped: 71 - 48 = 23.
  for (let i = 0; i < psuRepl - atlasMapped; i++) {
    const id = `WR-${20000 + i}`;
    claims.push({
      claimId: id,
      productModel: PRODUCT_MODEL,
      productSerial: `NS-R500-${20000 + i}`,
      component: OEM_PART,
      componentSerial: `NS-PSU-${20000 + i}`,
      supplierPart: 'NON-ATLAS',
      supplierLot: UNCOVERED_LOTS[i % UNCOVERED_LOTS.length],
      deliveryReceipt: `RCV-OTH-${i}`,
      // Placed before 2026-09-18 so they never fall in the current signal
      // window; the signal's 19 qualifying claims come only from the in-scope
      // population. Spread across the earlier dataset year deterministically.
      repairDate: new Date(Date.UTC(2025, 10, 1) + ((i * 11) % 300) * 86400000)
        .toISOString()
        .slice(0, 10),
      failureCode: FAILURE_NO_POWER,
      isAtlasMapped: false,
      evidenceState: 'Out of supplier scope',
      cost: 150 + Math.floor(rnd() * 80),
    });
  }

  // 3) No-power R500 claims that are NOT PSU replacements: 94 - 71 = 23.
  for (let i = 0; i < noPower - psuRepl; i++) {
    const id = `WR-${21000 + i}`;
    claims.push({
      claimId: id,
      productModel: PRODUCT_MODEL,
      productSerial: `NS-R500-${21000 + i}`,
      component: OTHER_COMPONENTS[i % OTHER_COMPONENTS.length],
      componentSerial: `NS-OTH-${21000 + i}`,
      supplierPart: '',
      supplierLot: '',
      deliveryReceipt: '',
      repairDate: isoDate(rnd),
      failureCode: FAILURE_NO_POWER,
      isAtlasMapped: false,
      evidenceState: 'Non-PSU no-power',
      cost: 90 + Math.floor(rnd() * 120),
    });
  }

  // 4) R500 claims that are NOT no-power: 642 - 94 = 548.
  for (let i = 0; i < r500Total - noPower; i++) {
    const id = `WR-${22000 + i}`;
    claims.push({
      claimId: id,
      productModel: PRODUCT_MODEL,
      productSerial: `NS-R500-${22000 + i}`,
      component: OTHER_COMPONENTS[i % OTHER_COMPONENTS.length],
      componentSerial: `NS-OTH-${22000 + i}`,
      supplierPart: '',
      supplierLot: '',
      deliveryReceipt: '',
      repairDate: isoDate(rnd),
      failureCode: OTHER_FAILURES[(i % (OTHER_FAILURES.length - 1)) + 1],
      isAtlasMapped: false,
      evidenceState: 'Other R500 repair',
      cost: 80 + Math.floor(rnd() * 200),
    });
  }

  // 5) Remaining non-R500 claims to reach 12,480 total.
  const remaining = TOTAL_CLAIMS - claims.length;
  for (let i = 0; i < remaining; i++) {
    const id = `WR-${30000 + i}`;
    claims.push({
      claimId: id,
      productModel: OTHER_PRODUCTS[i % OTHER_PRODUCTS.length],
      productSerial: `NS-${30000 + i}`,
      component: OTHER_COMPONENTS[i % OTHER_COMPONENTS.length],
      componentSerial: `NS-OTH-${30000 + i}`,
      supplierPart: '',
      supplierLot: '',
      deliveryReceipt: '',
      repairDate: isoDate(rnd),
      failureCode: OTHER_FAILURES[i % OTHER_FAILURES.length],
      isAtlasMapped: false,
      evidenceState: 'Unrelated product',
      cost: 60 + Math.floor(rnd() * 240),
    });
  }

  // Sanity: unique claim IDs.
  if (new Set(claims.map((c) => c.claimId)).size !== claims.length) {
    throw new Error('fixture contains duplicate claim IDs');
  }
  // Keep population ids intact.
  void popIds;

  _cache = claims;
  return claims;
}
