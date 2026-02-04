import Link from 'next/link';
import fr from '@/lib/i18n/dictionaries/fr.json';

export default function NotFound() {
  const t = fr.error.notFound;

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 bg-background">
      <div className="text-center relative">
        <h1 className="text-9xl font-black text-primary opacity-10 select-none tracking-tighter">
          {t.subtitle}
        </h1>
        <div className="-mt-12 relative z-10">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">
            {t.title}
          </h2>
          <p className="vibe-text-muted-foreground vibe-mb-8 vibe-text-lg">
            {t.description}
          </p>
          <Link
            href="/"
            className="vibe-button-primary px-8 vibe-py-3 inline-block"
          >
            {t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
