import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { CheckoutSuccessClient } from '@/components/checkout/checkout-success-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessClient locale={locale} />
    </Suspense>
  );
}
