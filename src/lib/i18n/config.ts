import { env } from '@/lib/core/env';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SupportedLocale,
} from '@/lib/config/site';

export const i18n = {
  defaultLocale: DEFAULT_LOCALE,
  locales: SUPPORTED_LOCALES,
  adminLocale: env.ADMIN_LOCALE || 'fr',
} as const;

export type Locale = string;

export function getLocaleFromPath(pathname: string): Locale {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? (localeMatch[1] as Locale) : i18n.defaultLocale;

  return i18n.locales.includes(locale as SupportedLocale)
    ? locale
    : i18n.defaultLocale;
}
