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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-red-500">500</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-muted-foreground mb-8">
          Désolé, quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
