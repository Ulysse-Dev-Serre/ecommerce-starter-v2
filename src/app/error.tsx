'use client';

import { useEffect } from 'react';

import Link from 'next/link';

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

  return (
    <div className="vibe-min-h-screen vibe-flex-center vibe-bg-background">
      <div className="vibe-text-center vibe-px-4">
        <h1 className="vibe-text-9xl vibe-text-error">500</h1>
        <h2 className="vibe-text-2xl vibe-text-semibold vibe-mt-4 vibe-mb-2">
          Une erreur est survenue
        </h2>
        <p className="vibe-text-muted-foreground vibe-mb-8">
          Désolé, quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
        <div className="vibe-flex-gap-4 vibe-flex-center">
          <button
            onClick={() => reset()}
            className="vibe-button-primary vibe-px-6 vibe-py-3"
          >
            Réessayer
          </button>
          <Link href="/" className="vibe-button-secondary vibe-px-6 vibe-py-3">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
