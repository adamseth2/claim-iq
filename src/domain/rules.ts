// Deterministic rules engine (PRD section 15).
// Derives the signal, investigation population, classifications, and the
// supported recovery total from the fixture. All math is transparent.
import {
  type Claim,
  type Classification,
  PRODUCT_MODEL,
  OEM_PART,
  FAILURE_NO_POWER,
  PER_UNIT_CAP,
  SIGNAL,
  INVESTIGATION_SCOPE,
} from './facts';
import { buildFixture } from './fixture';

export interface SignalResult {
  qualifyingCurrent: number;
  baselineAverage: number;
  ratio: number;
  ratioText: string;
  active: boolean;
}

export interface FunnelResult {
  completedClaims: number;
  r500Claims: number;
  noPowerClaims: number;
  psuReplacements: number;
  atlasMapped: number;
  supported: number;
}

export interface ClassificationResult {
  supported: Claim[];
  missing: Claim[];
  engineering: Claim[];
  excluded: Claim[];
  counts: Record<Classification, number>;
  total: number;
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

/** Signal rule: count current-window qualifying claims vs fixed baseline avg. */
export function computeSignal(claims: Claim[] = buildFixture()): SignalResult {
  // Deduplicate by claimId (source-version dedupe is implicit in the fixture).
  const seen = new Set<string>();
  const deduped = claims.filter((c) => {
    if (seen.has(c.claimId)) return false;
    seen.add(c.claimId);
    return true;
  });

  // Qualifying: completed R500 repairs, PSU-750 replacement, NO-POWER-v1,
  // within the current 30-day signal window.
  const qualifyingCurrent = deduped.filter(
    (c) =>
      c.productModel === PRODUCT_MODEL &&
      c.component === OEM_PART &&
      c.failureCode === FAILURE_NO_POWER &&
      inRange(c.repairDate, SIGNAL.currentWindow.from, SIGNAL.currentWindow.to),
  ).length;

  const baselineAverage = SIGNAL.baselineAvg; // precomputed historical baseline (6)
  const ratio = qualifyingCurrent / baselineAverage;
  const ratioText = `${ratio.toFixed(2)}x`;
  const active = qualifyingCurrent >= SIGNAL.minQualifying && ratio >= SIGNAL.threshold;

  return { qualifyingCurrent, baselineAverage, ratio, ratioText, active };
}

/** Investigation population rule: fixed scope + R500 + PSU-750 + Atlas mapping. */
export function computePopulation(claims: Claim[] = buildFixture()): Claim[] {
  return claims.filter(
    (c) =>
      c.isAtlasMapped &&
      c.productModel === PRODUCT_MODEL &&
      c.component === OEM_PART &&
      inRange(c.repairDate, INVESTIGATION_SCOPE.from, INVESTIGATION_SCOPE.to),
  );
}

/** Classify the 48-claim population into the four decision groups. */
export function classifyPopulation(claims: Claim[] = buildFixture()): ClassificationResult {
  const population = computePopulation(claims);
  const supported = population.filter((c) => c.classification === 'supported');
  const missing = population.filter((c) => c.classification === 'missing');
  const engineering = population.filter((c) => c.classification === 'engineering');
  const excluded = population.filter((c) => c.classification === 'excluded');

  return {
    supported,
    missing,
    engineering,
    excluded,
    counts: {
      supported: supported.length,
      missing: missing.length,
      engineering: engineering.length,
      excluded: excluded.length,
    },
    total: population.length,
  };
}

/** Potential recovery total — only evidence-supported claims, min(cost, cap). */
export function computeRecoveryTotal(claims: Claim[] = buildFixture()): {
  supportedCount: number;
  perClaim: number[];
  total: number;
} {
  const { supported } = classifyPopulation(claims);
  const perClaim = supported.map((c) => Math.min(c.cost, PER_UNIT_CAP));
  const total = perClaim.reduce((a, b) => a + b, 0);
  return { supportedCount: supported.length, perClaim, total };
}

/** Full population funnel, computed from the fixture. */
export function computeFunnel(claims: Claim[] = buildFixture()): FunnelResult {
  const completedClaims = claims.length;
  const r500 = claims.filter((c) => c.productModel === PRODUCT_MODEL);
  const noPower = r500.filter((c) => c.failureCode === FAILURE_NO_POWER);
  const psu = noPower.filter((c) => c.component === OEM_PART);
  const atlas = psu.filter((c) => c.isAtlasMapped);
  const supported = atlas.filter((c) => c.classification === 'supported');

  return {
    completedClaims,
    r500Claims: r500.length,
    noPowerClaims: noPower.length,
    psuReplacements: psu.length,
    atlasMapped: atlas.length,
    supported: supported.length,
  };
}

export interface TrendPoint {
  month: string; // yyyy-mm
  count: number;
  isCurrent: boolean;
}

/**
 * 12 trailing monthly counts of qualifying no-power R500 PSU repairs, for the
 * dashboard trend. The final bucket is the current 30-day window.
 */
export function computeTrend(claims: Claim[] = buildFixture()): TrendPoint[] {
  const qualifying = claims.filter(
    (c) =>
      c.productModel === PRODUCT_MODEL &&
      c.component === OEM_PART &&
      c.failureCode === FAILURE_NO_POWER,
  );
  const months: string[] = [];
  // Build 12 month buckets ending at 2026-10 (the as-of month).
  const end = new Date(Date.UTC(2026, 9, 1)); // 2026-10
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const counts = new Map<string, number>(months.map((m) => [m, 0]));
  for (const c of qualifying) {
    const m = c.repairDate.slice(0, 7);
    if (counts.has(m)) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return months.map((m) => ({
    month: m,
    count: counts.get(m) ?? 0,
    isCurrent: m === '2026-10',
  }));
}
