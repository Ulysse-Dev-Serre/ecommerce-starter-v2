import { Decimal } from '@prisma/client/runtime/library';

/**
 * Arrondi banquier (half-even) pour les calculs financiers
 * Réduit le biais statistique sur de grands volumes de transactions
 *
 * @param value - La valeur Decimal à arrondir
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns La valeur arrondie
 */
export function roundHalfEven(value: Decimal, decimals: number = 2): Decimal {
  const multiplier = new Decimal(10).pow(decimals);
  const shifted = value.times(multiplier);
  const truncated = shifted.floor();
  const remainder = shifted.minus(truncated);

  if (remainder.lessThan(0.5)) {
    return truncated.dividedBy(multiplier);
  } else if (remainder.greaterThan(0.5)) {
    return truncated.plus(1).dividedBy(multiplier);
  } else {
    // Exactement 0.5 → arrondir vers le pair le plus proche
    if (truncated.mod(2).equals(0)) {
      return truncated.dividedBy(multiplier);
    } else {
      return truncated.plus(1).dividedBy(multiplier);
    }
  }
}
