import Link from 'next/link';
import { Home } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'error.notFound' });

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="vibe-info-box vibe-container-max-4xl vibe-w-full bg-background vibe-border-none vibe-shadow-none">
        <h1 className="text-9xl font-black text-primary opacity-10 select-none tracking-tighter">
          404
        </h1>
        <div className="relative -mt-16 space-y-6">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
            {t('title')}
          </h2>
          <p className="text-muted-foreground vibe-text-lg leading-relaxed">
            {t('description')}
          </p>
          <div className="vibe-pt-8">
            <Link
              href={`/${locale}`}
              className="vibe-button-primary vibe-text-lg vibe-px-10 vibe-py-4"
            >
              <Home className="mr-3 h-16 w-16" />
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
