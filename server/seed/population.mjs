// Deterministic generator for the 48-claim investigation population rows.
// Classification totals: 24 supported, 15 missing-traceability, 6 engineering-review, 3 excluded.
import {
  PRODUCT_MODEL,
  OEM_PART,
  SUPPLIER_PART,
  COVERED_LOTS,
  VERIFIED_PART_COST,
  REP_CLAIM,
} from './facts.mjs';

const UNCOVERED_LOTS = ['ATL-24-109', 'UNK-LOT', ''];
const FAILURE_NO_POWER = 'NO-POWER-v1';
const FAILURE_OTHER = 'THERMAL-v1';

// Deterministic date spread across the 90-day investigation scope.
function repairDate(i) {
  // 2026-07-20 .. 2026-10-17
  const start = Date.UTC(2026, 6, 20);
  const day = 86400000;
  const d = new Date(start + ((i * 7) % 89) * day);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns exactly 48 deterministic claim rows.
 * classification in: supported | missing | engineering | excluded
 */
export function buildPopulation() {
  const rows = [];
  let n = 10460;

  const push = (classification, i) => {
    const claimId = `WR-${n++}`;
    let lot;
    let failure = FAILURE_NO_POWER;
    let evidenceState;
    let cost = VERIFIED_PART_COST;

    if (classification === 'supported') {
      lot = COVERED_LOTS[i % COVERED_LOTS.length];
      evidenceState = 'Complete';
    } else if (classification === 'missing') {
      lot = UNCOVERED_LOTS[i % UNCOVERED_LOTS.length] || '(none)';
      evidenceState = 'Missing supplier-lot';
    } else if (classification === 'engineering') {
      lot = COVERED_LOTS[i % COVERED_LOTS.length];
      evidenceState = 'Engineering review';
    } else {
      // excluded — documented non-supplier cause
      lot = COVERED_LOTS[i % COVERED_LOTS.length];
      failure = FAILURE_OTHER;
      evidenceState = 'Excluded (non-supplier)';
    }

    rows.push({
      claimId,
      product: PRODUCT_MODEL,
      productSerial: `NS-R500-${claimId.slice(3)}`,
      component: OEM_PART,
      componentSerial: `NS-PSU-${claimId.slice(3)}`,
      supplierPart: SUPPLIER_PART,
      supplierLot: lot,
      deliveryReceipt: classification === 'missing' ? '(none)' : `RCV-2501${18 + (i % 9)}-0${(i % 7) + 1}`,
      repairDate: repairDate(i),
      failureCode: failure,
      evidenceState,
      cost,
      classification,
    });
  };

  for (let i = 0; i < 24; i++) push('supported', i);
  for (let i = 0; i < 15; i++) push('missing', i);
  for (let i = 0; i < 6; i++) push('engineering', i);
  for (let i = 0; i < 3; i++) push('excluded', i);

  // Pin the representative claim as the first supported row.
  rows[0] = {
    ...rows[0],
    claimId: REP_CLAIM.claimId,
    componentSerial: REP_CLAIM.componentSerial,
    supplierLot: REP_CLAIM.supplierLot,
    deliveryReceipt: REP_CLAIM.deliveryReceipt,
    repairDate: REP_CLAIM.repairCompleted,
    cost: REP_CLAIM.verifiedPartCost,
  };

  return rows;
}
