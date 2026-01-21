import { getRequestConfig } from 'next-intl/server';
import { i18n } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Fix: Handle cases where locale is not passed correctly or fails to resolve
  let locale = await requestLocale;

  // Validate locale and default to 'en' if missing or invalid
  if (!locale || !i18n.locales.includes(locale as any)) {
    locale = i18n.defaultLocale;
  }

  return {
    locale,
    // Safely import the dictionary
    messages: (await import(`./dictionaries/${locale}.json`)).default,
  };
});
