// i18n Configuration
export const i18n = {
  defaultLocale: 'fr',
  locales: ['fr', 'en'] as const,
} as const;

export type Locale = (typeof i18n)['locales'][number];

export function getMessages(locale: string) {
  return import(`./dictionaries/${locale}.json`).then(module => module.default);
}

export function getLocaleFromPath(pathname: string): Locale {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;

  return i18n.locales.includes(locale as Locale) ? locale as Locale : i18n.defaultLocale;
}
