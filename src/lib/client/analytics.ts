import { API_ROUTES } from '@/lib/config/api-routes';
import { UTMData } from '@/lib/types/domain/analytics';

import { getCookie, setCookie } from './cookies';

const UTM_COOKIE_NAME = 'last_utm_data';
const ANONYMOUS_ID_COOKIE = 'analytics_anon_id';

export function getUTMFromURL(): UTMData {
  if (typeof window === 'undefined') return {};
  const urlParams = new URLSearchParams(window.location.search);

  const utm: UTMData = {
    utmSource: urlParams.get('utm_source') || undefined,
    utmMedium: urlParams.get('utm_medium') || undefined,
    utmCampaign: urlParams.get('utm_campaign') || undefined,
    utmContent: urlParams.get('utm_content') || undefined,
    utmTerm: urlParams.get('utm_term') || undefined,
  };

  // On ne retourne que si au moins un paramètre est présent
  return Object.values(utm).some(v => v !== undefined) ? utm : {};
}

export function getOrSetAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = getCookie(ANONYMOUS_ID_COOKIE);
  if (!id) {
    id = crypto.randomUUID();
    setCookie(ANONYMOUS_ID_COOKIE, id, 365); // Expire dans 1 an
  }
  return id;
}

export function captureAndSaveUTM() {
  const utm = getUTMFromURL();
  if (Object.keys(utm).length > 0) {
    // On sauvegarde en session pour la durée de la visite
    sessionStorage.setItem(UTM_COOKIE_NAME, JSON.stringify(utm));
  }
}

export function getStoredUTM(): UTMData {
  if (typeof window === 'undefined') return {};
  const stored = sessionStorage.getItem(UTM_COOKIE_NAME);
  try {
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export async function trackEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
  eventName?: string
) {
  if (typeof window === 'undefined') return;

  const utm = getStoredUTM();
  const anonymousId = getOrSetAnonymousId();

  try {
    // On envoie à notre propre API interne
    await fetch(API_ROUTES.TRACKING.EVENTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        eventName,
        metadata,
        path: window.location.pathname,
        anonymousId,
        ...utm,
      }),
    });
  } catch (error) {
    // On ne bloque pas l'utilisateur si l'analytics échoue
    console.warn('Analytics tracking failed', error);
  }
}
