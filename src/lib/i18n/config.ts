// i18n Configuration
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en';
const locales = process.env.NEXT_PUBLIC_LOCALES
  ? (process.env.NEXT_PUBLIC_LOCALES.split(',') as string[])
  : ['en', 'fr'];

const adminLocale = process.env.ADMIN_LOCALE || defaultLocale;

export const i18n = {
  defaultLocale,
  locales,
  adminLocale,
} as const;

export type Locale = string;

export function getLocaleFromPath(pathname: string): Locale {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;

  return i18n.locales.includes(locale) ? locale : i18n.defaultLocale;
}
