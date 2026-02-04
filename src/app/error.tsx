'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import fr from '@/lib/i18n/dictionaries/fr.json';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const t = fr.error.serverError;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-background">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-error">{t.subtitle}</h1>
        <h2 className="text-3xl font-bold text-foreground mt-4 vibe-mb-2">
          {t.title}
        </h2>
        <p className="vibe-text-muted-foreground vibe-mb-8">{t.description}</p>
        <div className="vibe-flex-center gap-4">
          <button
            onClick={() => reset()}
            className="vibe-button-primary vibe-px-6 vibe-py-3"
          >
            {t.retry}
          </button>
          <Link href="/" className="vibe-button-secondary vibe-px-6 vibe-py-3">
            {t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
