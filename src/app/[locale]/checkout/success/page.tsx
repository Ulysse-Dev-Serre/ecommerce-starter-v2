'use client';

import { use, useEffect, useState } from 'react';

import { CheckCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { i18n } from '@/lib/i18n/config';

export default function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): React.ReactElement {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent'); // Nouveau flow: payment_intent
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    fr: {
      processing: 'Traitement de votre paiement en cours...',
      title: 'Paiement réussi !',
      message: 'Votre commande a été confirmée et est en cours de traitement.',
      orderNumber: 'Numéro de commande',
      sessionId: 'ID de transaction', // Updated label to be more generic
      waitMessage:
        'Veuillez patienter pendant que nous confirmons votre commande...',
      backToShop: 'Retour à la boutique',
      error: 'Une erreur est survenue lors de la vérification de la commande.',
    },
    en: {
      processing: 'Processing your payment...',
      title: 'Payment Successful!',
      message: 'Your order has been confirmed and is being processed.',
      orderNumber: 'Order Number',
      sessionId: 'Transaction ID', // Updated label
      waitMessage: 'Please wait while we confirm your order...',
      backToShop: 'Back to shop',
      error: 'An error occurred while verifying the order.',
    },
  };

  const { locale: localeParam } = use(params);
  const locale = localeParam || i18n.defaultLocale;
  const t =
    translations[locale as keyof typeof translations] || translations.en;

  useEffect(() => {
    // On accepte soit un session_id (ancien flow), soit un payment_intent (nouveau flow)
    const identifier = sessionId || paymentIntentId;

    if (!identifier) {
      setError('No session or payment ID provided');
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 2s = 60 seconds max

    const checkOrder = async () => {
      try {
        // L'API verify doit être mise à jour pour accepter payment_intent_id aussi
        // ou on passe tout dans "session_id" si l'API est flexible, mais mieux vaut être explicite.
        // On va assumer que l'API peut chercher par PI si on lui passe le bon param.

        let url = `/api/orders/verify?session_id=${identifier}`;
        if (paymentIntentId) {
          url = `/api/orders/verify?payment_intent_id=${paymentIntentId}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.exists && data.orderNumber) {
          setOrderConfirmed(true);
          setOrderNumber(data.orderNumber);
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
            setError(
              'Order verification timeout. Please check your email for confirmation.'
            );
          }
        }
      }, 2000);

      // Cleanup
      return () => clearInterval(interval);
    });
  }, [sessionId, paymentIntentId]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-red-200 rounded-lg shadow-sm p-8 text-center">
            <p className="text-lg text-red-600 mb-6">{t.error}</p>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <a
              href={`/${locale}/shop`}
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t.backToShop}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!orderConfirmed) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t.processing}
            </h1>

            <p className="text-lg text-gray-600 mb-6">{t.waitMessage}</p>

            {sessionId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{t.sessionId}</p>
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

  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.title}</h1>

          <p className="text-lg text-gray-600 mb-6">{t.message}</p>

          {orderNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 mb-1">{t.orderNumber}</p>
              <p className="text-xl font-bold text-green-900">{orderNumber}</p>
            </div>
          )}

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">{t.sessionId}</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {sessionId}
              </p>
            </div>
          )}

          <a
            href={`/${locale}/shop`}
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t.backToShop}
          </a>
        </div>
      </div>
    </div>
  );
}
