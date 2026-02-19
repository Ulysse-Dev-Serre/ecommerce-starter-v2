import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SupportedLocale,
} from '@/lib/config/site';

/**
 * Charge dynamiquement le dictionnaire pour une langue donnée.
 * Évite le hardcoding des imports dans les services.
 */
export async function getDictionary(locale: string) {
  const targetLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? locale
    : DEFAULT_LOCALE;

  try {
    // Note: Le path doit être relatif au fichier actuel pour l'import dynamique
    // ou utiliser un alias si configuré pour les imports dynamiques.
    return (await import(`./dictionaries/${targetLocale}.json`)).default;
  } catch (error) {
    console.error(
      `Failed to load dictionary for locale: ${targetLocale}`,
      error
    );
    // Fallback au dictionnaire par défaut
    return (await import(`./dictionaries/${DEFAULT_LOCALE}.json`)).default;
  }
}
