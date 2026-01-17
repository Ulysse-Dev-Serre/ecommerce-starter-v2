import Link from 'next/link';

interface NotFoundProps {
  params: Promise<{ locale: string }>;
}

export default async function NotFound({ params }: NotFoundProps) {
  const { locale } = await params;

  // Fallback to 'fr' if locale is somehow invalid, though usually handled by middleware
  const safeLocale = ['fr', 'en'].includes(locale) ? locale : 'fr';

  const dictionary = (
    await import(`@/lib/i18n/dictionaries/${safeLocale}.json`)
  ).default;
  const t = dictionary.error.notFound;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4 animate-in fade-in duration-500">
        <h1 className="text-9xl font-bold theme-primary opacity-20 select-none">
          {t.subtitle}
        </h1>
        <div className="relative -mt-12">
          <h2 className="text-3xl font-bold mb-4 theme-primary">{t.title}</h2>
          <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
            {t.description}
          </p>
          <Link
            href={`/${safeLocale}`}
            className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-all transform hover:scale-105 shadow-md font-medium"
          >
            🏡 {t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
