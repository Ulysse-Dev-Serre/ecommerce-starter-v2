import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Fix: Handle cases where locale is not passed correctly or fails to resolve
  let locale = await requestLocale;

  // Validate locale and default to 'fr' if missing or invalid
  if (!locale || (locale !== 'fr' && locale !== 'en')) {
    locale = 'fr';
  }

  return {
    locale,
    // Safely import the dictionary
    messages: (await import(`./dictionaries/${locale}.json`)).default,
  };
});

// Helper to get messages for server components if needed manually
export async function getMessages(
  locale: string
): Promise<Record<string, unknown>> {
  try {
    return (await import(`./dictionaries/${locale}.json`)).default;
  } catch {
    // Fallback to French if locale not found
    return (await import(`./dictionaries/fr.json`)).default;
  }
}
