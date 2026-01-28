import Link from 'next/link';
import { Home } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'error.notFound' });

  return (
    <div className="vibe-404-container">
      <div className="vibe-info-box vibe-container-max-4xl vibe-w-full vibe-bg-background vibe-border-none vibe-shadow-none">
        <h1 className="vibe-404-bg-text">404</h1>
        <div className="vibe-relative vibe-mt-n16 vibe-stack-y-6">
          <h2 className="vibe-404-title">{t('title')}</h2>
          <p className="vibe-text-muted vibe-text-lg vibe-leading-relaxed">
            {t('description')}
          </p>
          <div className="vibe-pt-8">
            <Link
              href={`/${locale}`}
              className="vibe-button-primary vibe-text-lg vibe-px-10 vibe-py-4"
            >
              <Home className="vibe-mr-3 vibe-icon-md" />
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
