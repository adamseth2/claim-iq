// Synthetic evidence rows mirror src/domain/fixture.ts, including IDs, dates and costs.
// src/domain/seed.test.ts guards the complete row-by-row contract against drift.
import { PRODUCT_MODEL, OEM_PART, SUPPLIER_PART, COVERED_LOTS,
  VERIFIED_PART_COST, REP_CLAIM, SIGNAL } from './facts.mjs';
const FAILURE_NO_POWER = SIGNAL.failureGroup;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86400000;
const isoFrom = (ms) => new Date(ms).toISOString().slice(0, 10);

// Deterministic date in the CURRENT 30-day signal window (2026-09-18..2026-10-17).
function currentWindowDate(k) {
  return isoFrom(Date.UTC(2026, 8, 18) + ((k * 7) % 30) * DAY);
}

// Deterministic date in the two 30-day periods before the signal window.
// j in 0..28: 14 claims in 2026-07-20..2026-08-18, 15 in 2026-08-19..2026-09-17,
// giving an escalating 14 -> 15 -> 19 ramp across the 90-day scope.
function earlierScopeDate(j) {
  if (j < 14) return isoFrom(Date.UTC(2026, 6, 20) + j * 2 * DAY);
  return isoFrom(Date.UTC(2026, 7, 19) + (j - 14) * 2 * DAY);
}

// Interleaved, deterministic classification order so claim IDs and dates are
// not grouped by outcome. Index 0 is supported (pinned to WR-10482).
function classificationOrder() {
  const pool = [
    ...Array(24).fill('supported'),
    ...Array(15).fill('missing'),
    ...Array(6).fill('engineering'),
    ...Array(3).fill('excluded'),
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
export function buildPopulation() {
  const rows = [];
  let n = 10600;
  let g = 0; // global ordinal across all classifications
  // Exactly this many population claims fall inside the current 30-day window,
  // producing the signal's qualifying count of 19.
  const IN_WINDOW = 19;

  const push = (classification, i) => {
    const claimId = `WR-${n++}`;
    const failure = FAILURE_NO_POWER;
    let lot;
    let evidenceState;
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
      product: PRODUCT_MODEL,
      productSerial: `NS-R500-${claimId.slice(3)}`,
      component: OEM_PART,
      componentSerial: `NS-PSU-${claimId.slice(3)}`,
      supplierPart: SUPPLIER_PART,
      supplierLot: lot,
      deliveryReceipt:
        classification === 'missing' ? '(none)' : `RCV-2501${18 + (i % 9)}-0${(i % 7) + 1}`,
      repairDate,
      failureCode: failure,
      evidenceState,
      cost,
      classification,
    });
  };

  const perClass = {
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
