'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface CheckoutSuccessClientProps {
  locale: string;
}

export function CheckoutSuccessClient({
  locale,
}: CheckoutSuccessClientProps): React.ReactElement {
  const t = useTranslations('CheckoutSuccess');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const identifier = sessionId || paymentIntentId;

    if (!identifier) {
      setError(t('noId'));
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    const checkOrder = async () => {
      try {
        let url = `/api/orders/verify?session_id=${identifier}`;
        if (paymentIntentId) {
          url = `/api/orders/verify?payment_intent_id=${paymentIntentId}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.exists && data.orderNumber) {
          setOrderConfirmed(true);
          setTimeout(() => {
            window.location.href = `/${locale}/orders/${data.orderNumber}`;
          }, 2000);
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error verifying order:', err);
        return false;
      }
    };

    void checkOrder().then(confirmed => {
      if (confirmed) return;

      const interval = setInterval(async () => {
        attempts++;
        const confirmed = await checkOrder();
        if (confirmed || attempts >= maxAttempts) {
          clearInterval(interval);
          if (!confirmed && attempts >= maxAttempts) {
            setError(t('timeout'));
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    });
  }, [sessionId, paymentIntentId, locale, t]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="vibe-info-box max-w-md w-full">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-error opacity-80" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t('error')}
          </h1>
          <p className="text-muted-foreground mb-8 text-lg font-medium">
            {error}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="vibe-button-primary h-12 px-8"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="vibe-info-box max-w-md w-full">
        <div className="flex justify-center mb-8 relative">
          {orderConfirmed ? (
            <CheckCircle className="h-20 w-20 text-success animate-in zoom-in duration-500" />
          ) : (
            <Loader2 className="h-20 w-20 text-primary animate-spin" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          {orderConfirmed ? t('redirecting') : t('processing')}
        </h1>

        <p className="text-xl text-muted-foreground mb-8 font-medium">
          {orderConfirmed ? t('title') : t('waitMessage')}
        </p>

        {!orderConfirmed && sessionId && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground border border-border/50 break-all">
            {t('sessionId')}: {sessionId}
          </div>
        )}
      </div>
    </div>
  );
}
