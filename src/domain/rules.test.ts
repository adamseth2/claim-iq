import { describe, it, expect } from 'vitest';
import { buildFixture } from './fixture';
import {
  computeSignal,
  computePopulation,
  classifyPopulation,
  computeRecoveryTotal,
  computeFunnel,
} from './rules';
import { SUPPORTED_TOTAL } from './facts';

describe('fixture', () => {
  it('contains exactly 12,480 unique claims', () => {
    const claims = buildFixture();
    expect(claims.length).toBe(12480);
    expect(new Set(claims.map((c) => c.claimId)).size).toBe(12480);
  });
});

describe('signal rule', () => {
  it('current qualifying count is 19', () => {
    expect(computeSignal().qualifyingCurrent).toBe(19);
  });
  it('baseline average is 6', () => {
    expect(computeSignal().baselineAverage).toBe(6);
  });
  it('ratio displays as 3.17x', () => {
    expect(computeSignal().ratioText).toBe('3.17x');
  });
  it('signal is active', () => {
    expect(computeSignal().active).toBe(true);
  });
});

describe('investigation population', () => {
  it('is exactly 48 claims', () => {
    expect(computePopulation().length).toBe(48);
  });
  it('each claim appears exactly once', () => {
    const pop = computePopulation();
    expect(new Set(pop.map((c) => c.claimId)).size).toBe(48);
  });
});

describe('classification', () => {
  it('reconciles to 24 / 15 / 6 / 3 = 48', () => {
    const c = classifyPopulation().counts;
    expect(c.supported).toBe(24);
    expect(c.missing).toBe(15);
    expect(c.engineering).toBe(6);
    expect(c.excluded).toBe(3);
    expect(c.supported + c.missing + c.engineering + c.excluded).toBe(48);
  });
});

describe('recovery total', () => {
  it('is exactly $14,880 from 24 supported claims', () => {
    const r = computeRecoveryTotal();
    expect(r.supportedCount).toBe(24);
    expect(r.total).toBe(14880);
    expect(r.total).toBe(SUPPORTED_TOTAL);
  });
  it('each supported claim contributes min(cost, $650) = $620', () => {
    const r = computeRecoveryTotal();
    expect(r.perClaim.every((v) => v === 620)).toBe(true);
  });
});

describe('funnel', () => {
  it('reconciles 12,480 -> 642 -> 94 -> 71 -> 48 -> 24', () => {
    const f = computeFunnel();
    expect(f.completedClaims).toBe(12480);
    expect(f.r500Claims).toBe(642);
    expect(f.noPowerClaims).toBe(94);
    expect(f.psuReplacements).toBe(71);
    expect(f.atlasMapped).toBe(48);
    expect(f.supported).toBe(24);
  });
});
