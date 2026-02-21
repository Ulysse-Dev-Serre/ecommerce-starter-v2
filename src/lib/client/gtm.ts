import { env } from '@/lib/core/env';

export const GTM_ID = env.NEXT_PUBLIC_GTM_ID;

type WindowWithDataLayer = Window & {
  dataLayer: Record<string, unknown>[];
};

declare const window: WindowWithDataLayer;

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page: url,
    });
  }
};

export const sendGTMEvent = (
  eventName: string,
  payload: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return;

  // Initialize dataLayer if it doesn't exist (robustness)
  window.dataLayer = window.dataLayer || [];

  window.dataLayer.push({
    event: eventName,
    ...payload,
  });
};
