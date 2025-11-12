import { CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CheckoutSuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: CheckoutSuccessPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;

  const translations = {
    fr: {
      title: 'Paiement réussi !',
      message: 'Votre commande a été confirmée et est en cours de traitement.',
      sessionId: 'ID de session',
      processing:
        'Votre paiement a été accepté. La commande sera créée dans quelques instants.',
      backToShop: 'Retour à la boutique',
    },
    en: {
      title: 'Payment Successful!',
      message: 'Your order has been confirmed and is being processed.',
      sessionId: 'Session ID',
      processing:
        'Your payment has been accepted. The order will be created shortly.',
      backToShop: 'Back to shop',
    },
  };

  const t =
    translations[locale as keyof typeof translations] || translations.en;

  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.title}</h1>

          <p className="text-lg text-gray-600 mb-6">{t.message}</p>

          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">{t.sessionId}</p>
              <p className="text-xs font-mono text-gray-700 break-all">
                {sessionId}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800">ℹ️ {t.processing}</p>
          </div>

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
