import { describe, expect, it } from 'vitest';
import { buildPopulation } from '../../server/seed/population.mjs';
import { buildInvestigationPopulation } from './fixture';
import { PER_UNIT_CAP, SUPPORTED_TOTAL, SIGNAL } from './facts';

describe('seed evidence population', () => {
  it('matches every UI claim ID, serial, lot, date, cost and classification', () => {
    const rows = buildPopulation().map(({ product, ...row }) => ({
      ...row, productModel: product, isAtlasMapped: true,
    }));
    expect(rows).toEqual(buildInvestigationPopulation());
    expect(new Set(rows.map((r) => r.claimId)).size).toBe(48);
  });
  it('preserves the current signal window and supported economics', () => {
    const rows = buildPopulation();
    const current = rows.filter((r) => r.repairDate >= SIGNAL.currentWindow.from &&
      r.repairDate <= SIGNAL.currentWindow.to);
    expect(current).toHaveLength(19);
    expect(rows.filter((r) => r.classification === 'supported')
      .reduce((sum, r) => sum + Math.min(r.cost, PER_UNIT_CAP), 0)).toBe(SUPPORTED_TOTAL);
    expect(rows.some((r) => r.classification !== 'supported' && r.cost > PER_UNIT_CAP)).toBe(true);
  });
});
