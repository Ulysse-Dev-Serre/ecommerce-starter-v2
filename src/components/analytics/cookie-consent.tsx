'use client';

import { useEffect } from 'react';

import * as CookieConsent from 'vanilla-cookieconsent';

import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { cookieConfig } from '@/lib/config/cookie-config';

export default function CookieConsentComponent() {
  useEffect(() => {
    // Define the type for the callback argument
    // vanilla-cookieconsent passes the cookie object to callbacks

    void CookieConsent.run({
      ...cookieConfig,
      onFirstConsent: ({ cookie }) => {
        updateGtmConsent(cookie);
      },
      onConsent: ({ cookie }) => {
        updateGtmConsent(cookie);
      },
      onChange: ({ cookie }) => {
        updateGtmConsent(cookie);
      },
    });
  }, []);

  return null;
}

interface CookieConsentValue {
  categories: string[];
}

type GtagArgs = Array<string | string[] | Record<string, string> | undefined>;

function updateGtmConsent(cookie: CookieConsentValue) {
  if (typeof window === 'undefined') return;

  const grantedCategories = cookie.categories || [];

  const analyticsConsent = grantedCategories.includes('analytics')
    ? 'granted'
    : 'denied';
  const marketingConsent = grantedCategories.includes('marketing')
    ? 'granted'
    : 'denied';

  // Extend window interface
  const w = window as unknown as Window & {
    dataLayer: (Record<string, unknown> | GtagArgs)[];
  };
  w.dataLayer = w.dataLayer || [];

  function gtag(...args: GtagArgs) {
    w.dataLayer.push(args);
  }

  // Update GTM Consent Mode
  gtag('consent', 'update', {
    analytics_storage: analyticsConsent,
    ad_storage: marketingConsent,
    ad_user_data: marketingConsent,
    ad_personalization: marketingConsent,
  });

  // Trigger a custom event so GTM can fire tags immediately after consent
  w.dataLayer.push({
    event: 'consent_update',
    analytics_status: analyticsConsent,
    marketing_status: marketingConsent,
  });
}
