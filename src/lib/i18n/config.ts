// i18n Configuration
import { env } from '../env';

const defaultLocale = env.NEXT_PUBLIC_DEFAULT_LOCALE;
const locales = env.NEXT_PUBLIC_LOCALES;

const adminLocale = env.ADMIN_LOCALE;

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
