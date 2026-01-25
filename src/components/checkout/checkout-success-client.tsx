'use client';

import { useEffect, useState } from 'react';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

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
    // On accepte soit un session_id (ancien flow), soit un payment_intent (nouveau flow)
    const identifier = sessionId || paymentIntentId;

    if (!identifier) {
      setError(t('noId'));
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 2s = 60 seconds max

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
          // Redirection vers la page de commande pour nettoyer l'URL et afficher les détails
          window.location.href = `/${locale}/orders/${data.orderNumber}`;
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error verifying order:', err);
        return false;
      }
    };

    // Vérification initiale
    void checkOrder().then(confirmed => {
      if (confirmed) return;

      // Si pas encore confirmé, on poll toutes les 2 secondes
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

      // Cleanup
      return () => clearInterval(interval);
    });
  }, [sessionId, paymentIntentId, locale, t]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-red-200 rounded-lg shadow-sm p-8 text-center">
            <p className="text-lg text-red-600 mb-6">{t('error')}</p>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <a
              href={`/${locale}/shop`}
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('backToShop')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Pendant le chargement ou la redirection
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {orderConfirmed ? t('redirecting') : t('processing')}
          </h1>

          <p className="text-lg text-gray-600 mb-6">{t('waitMessage')}</p>

          {sessionId && !orderConfirmed && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">{t('sessionId')}</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {sessionId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
