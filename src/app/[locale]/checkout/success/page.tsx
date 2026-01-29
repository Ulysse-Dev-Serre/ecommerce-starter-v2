import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { CheckoutSuccessClient } from '@/components/checkout/checkout-success-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkoutSuccess' });

  return {
    title: t('title'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkoutSuccess' });

  return (
    <div className="vibe-section-py vibe-flex-grow">
      <div className="vibe-layout-container">
        {/* H1 visible immediately for SEO/Accessibility while the client component verifies the order */}
        <h1 className="vibe-page-header">{t('title')}</h1>

        <Suspense fallback={<LoadingState />}>
          <CheckoutSuccessClient locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
