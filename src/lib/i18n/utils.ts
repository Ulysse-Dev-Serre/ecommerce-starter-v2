import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./dictionaries/${locale}.json`)).default
}))

// Helper to get messages for server components
export async function getMessages(locale: string): Promise<Record<string, unknown>> {
  try {
    return (await import(`./dictionaries/${locale}.json`)).default
  } catch {
    // Fallback to French if locale not found
    return (await import(`./dictionaries/fr.json`)).default
  }
}
