import type { Claim } from '../../src/domain/facts';
export type SeedClaim = Omit<Claim, 'productModel' | 'isAtlasMapped'> & {
  product: string;
  classification: NonNullable<Claim['classification']>;
};
export function buildPopulation(): SeedClaim[];
