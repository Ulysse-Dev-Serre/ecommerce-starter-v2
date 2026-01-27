import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';

import { CheckoutSuccessClient } from '@/components/checkout/checkout-success-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <Suspense fallback={<LoadingState />}>
      <CheckoutSuccessClient locale={locale} />
    </Suspense>
  );
}
