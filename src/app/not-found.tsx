import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Page non trouvée</h2>
        <p className="text-muted-foreground mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
