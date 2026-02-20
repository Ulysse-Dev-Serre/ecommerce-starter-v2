import { toNum } from '@/lib/utils/number';

import type { Decimal } from '@prisma/client/runtime/library';

/**
 * Formate un poids pour l'affichage.
 * Note : Le système utilise exclusivement le KG pour rester cohérent avec Shippo/UPS.
 */
export function formatWeight(
  weight: number | string | Decimal | null | undefined
): string {
  if (weight === null || weight === undefined) return '';

  const numericWeight = toNum(weight);

  if (numericWeight === 0) return '';

  return `${numericWeight} kg`;
}

/**
 * Formate les dimensions pour l'affichage.
 * Note : Le système utilise exclusivement le CM pour rester cohérent avec Shippo/UPS.
 */
export function formatDimensions(
  dimensions:
    | { length?: number; width?: number; height?: number }
    | null
    | undefined
): string {
  if (!dimensions) return '';

  const { length = 0, width = 0, height = 0 } = dimensions;

  // Si toutes les dimensions sont à 0, on n'affiche rien
  if (Number(length) === 0 && Number(width) === 0 && Number(height) === 0)
    return '';

  return `${length} x ${width} x ${height} cm`;
}
