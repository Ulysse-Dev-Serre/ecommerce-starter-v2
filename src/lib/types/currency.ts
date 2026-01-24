/**
 * Devises supportées par l'application.
 * Utilisé pour typer strictement les opérations monétaires partout dans le code.
 */
export const SUPPORTED_CURRENCIES = ['CAD', 'USD'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
