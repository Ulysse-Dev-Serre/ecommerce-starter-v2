import { Prisma, Decimal } from '@/generated/prisma';

/**
 * Convertit une valeur numérique (number, string ou Decimal Prisma) en number de manière sécurisée.
 */
export function toNum(
  value: number | string | Decimal | null | undefined
): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as unknown as { toNumber: () => number }).toNumber();
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  return typeof value === 'number' ? value : 0;
}
