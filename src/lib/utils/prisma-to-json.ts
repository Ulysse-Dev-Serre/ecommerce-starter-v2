/**
 * Convertit les objets Prisma (avec Decimal, BigInt, Date, etc.) en objets JavaScript simples
 * pour éviter les erreurs de sérialisation entre Server Components et Client Components
 */
export function prismaToJson<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
