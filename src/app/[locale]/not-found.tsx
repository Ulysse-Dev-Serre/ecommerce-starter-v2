import Link from 'next/link';
import { Home } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'error.notFound' });

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="vibe-info-box max-w-lg w-full bg-background border-none shadow-none">
        <h1 className="text-9xl font-black text-primary opacity-10 select-none tracking-tighter">
          404
        </h1>
        <div className="relative -mt-16 space-y-6">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t('description')}
          </p>
          <div className="pt-8">
            <Link
              href={`/${locale}`}
              className="vibe-button vibe-button-primary text-lg px-10 py-4"
            >
              <Home className="mr-3 h-6 w-6" />
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
