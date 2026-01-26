import { env } from '@/lib/env';

/**
 * Devises supportées par l'application.
 * Utilisé pour typer strictement les opérations monétaires partout dans le code.
 */
export const SUPPORTED_CURRENCIES =
  env.NEXT_PUBLIC_SUPPORTED_CURRENCIES as string[];

export type SupportedCurrency = string;
