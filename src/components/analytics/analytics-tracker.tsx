'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAndSaveUTM, trackEvent } from '@/lib/client/analytics';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Capturer les UTMs si présents dans l'URL
    captureAndSaveUTM();

    // 2. Traquer la vue de page
    void trackEvent('page_view', {
      title: document.title,
    });
  }, [pathname, searchParams]); // Relancer à chaque changement de route ou de paramètres

  return null; // Composant invisible
}
