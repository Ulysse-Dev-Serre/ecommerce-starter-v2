'use client';

// src/app/not-found.tsx
// Root level 404 (always static in FR as fallback when outside localized routes)

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="vibe-min-h-screen vibe-flex-center vibe-bg-background">
      <div className="vibe-text-center vibe-px-4">
        <h1 className="vibe-text-9xl vibe-text-muted vibe-opacity-30">404</h1>
        <div className="vibe-mt-n-12 vibe-relative">
          <h2 className="vibe-text-2xl vibe-text-semibold vibe-mb-2">
            Page non trouvée
          </h2>
          <p className="vibe-text-muted-foreground vibe-mb-8">
            La page que vous cherchez n&apos;existe pas.
          </p>
          <Link href="/" className="vibe-button-primary vibe-px-6 vibe-py-3">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
