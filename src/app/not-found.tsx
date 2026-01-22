'use client';

// src/app/not-found.tsx
// Root level 404 (always static in FR as fallback when outside localized routes)

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-muted opacity-30">404</h1>
        <div className="-mt-12 relative">
          <h2 className="text-2xl font-semibold mb-2">Page non trouvée</h2>
          <p className="text-muted-foreground mb-8">
            La page que vous cherchez n&apos;existe pas.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
