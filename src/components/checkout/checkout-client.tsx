'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialisation de Stripe en dehors du composant pour éviter de le recharger à chaque render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutClientProps {
  cartId: string;
  locale: string;
  initialTotal: number;
  currency: string;
  translations: {
    title: string;
    shippingAddress: string;
    shippingMethod: string;
    payment: string;
    payNow: string;
    loading: string;
    error: string;
    orderSummary: string;
    subtotal: string;
    shipping: string;
    totalToPay: string;
    confirmAddress: string;
    calculating: string;
  };
  userEmail?: string | null | undefined;
}

export function CheckoutClient({
  cartId,
  locale,
  initialTotal,
  currency,
  translations: t,
  userEmail,
}: CheckoutClientProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Au chargement, on crée une PaymentIntent (ou Session) vide pour avoir le clientSecret
  // C'est nécessaire pour initialiser <Elements> de Stripe
  useEffect(() => {
    // TODO: Créer une route API dédiée pour initier l'intention de paiement custom
    // Pour l'instant on va simuler ou appeler l'existante si compatible

    // NOTE: C'est ici que la stratégie change. Avec "AddressElement", on a besoin d'un PaymentIntent
    // ou d'un SetupIntent dès le début sur le serveur.

    // On va devoir modifier /api/checkout/create-session ou en créer une nouvelle /api/checkout/create-intent
    // car 'create-session' crée une session Stripe Checkout (page hébergée), pas un Intent pour Elements custom.

    fetch('/api/checkout/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId, currency }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError('Failed to init payment');
      });
  }, [cartId, currency]);

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!clientSecret) return <div className="p-4">Loading checkout...</div>;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0f172a', // slate-900 like
            colorText: '#1e293b', // slate-800
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Label': {
              color: '#334155', // slate-700
              fontWeight: '500',
            },
            '.Input': {
              borderColor: '#e2e8f0', // slate-200
              color: '#1e293b',
            },
          },
        },
        locale: locale as any,
      }}
    >
      <CheckoutForm
        clientSecret={clientSecret}
        currency={currency}
        translations={t}
        locale={locale}
        initialTotal={initialTotal}
        userEmail={userEmail}
      />
    </Elements>
  );
}

interface CheckoutFormProps {
  clientSecret: string;
  currency: string;
  locale: string;
  initialTotal: number;
  translations: {
    title: string;
    shippingAddress: string;
    shippingMethod: string;
    payment: string;
    payNow: string;
    loading: string;
    error: string;
    orderSummary: string;
    subtotal: string;
    shipping: string;
    totalToPay: string;
    confirmAddress: string;
    calculating: string;
  };
  userEmail?: string | null | undefined;
}

function CheckoutForm({
  clientSecret,
  currency,
  locale,
  initialTotal,
  translations: t,
  userEmail,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New states for better UX/Debugging of shipping rates
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedShippingRatesFetch, setHasAttemptedShippingRatesFetch] =
    useState(false);

  // Timer ref for debounce (plus nécessaire avec le bouton manuel, mais on peut laisser pour nettoyage)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Ref to store the last address we successfully fetched rates for
  const lastFetchedAddress = useRef<string>('');

  // State pour stocker l'adresse en attente de validation
  const [tempAddress, setTempAddress] = useState<any>(null);
  const [tempName, setTempName] = useState<string>('');
  const [phone, setPhone] = useState<string>(''); // Nouveau state pour le téléphone
  const [isAddressReady, setIsAddressReady] = useState(false);

  // Initialize initialTotal in state
  const [total, setTotal] = useState(initialTotal);

  // Recalculate total when shipping rate changes
  useEffect(() => {
    if (selectedRate) {
      // Add shipping cost to initial total
      const shippingCost = parseFloat(selectedRate.amount);
      setTotal(initialTotal + shippingCost);
    } else {
      setTotal(initialTotal);
    }
  }, [selectedRate, initialTotal]);

  // Fonction helper pour update l'intent (sera appelée au click)
  const updatePaymentIntent = async (rate: any) => {
    try {
      setSelectedRate(rate);

      // Extract PaymentIntent ID from clientSecret
      const paymentIntentId = clientSecret.split('_secret_')[0];

      const res = await fetch('/api/checkout/update-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          shippingRate: rate,
          currency,
        }),
      });
      const data = await res.json();
      if (data.success && data.amount) {
        console.log('Payment intent updated with new total:', data.amount);
      }
    } catch (err) {
      console.error('Failed to update shipping cost', err);
    }
  };

  // Callback quand l'adresse change dans le formulaire (Mise à jour locale UNIQUEMENT)
  const handleAddressChange = (event: any) => {
    setTempAddress(event.value.address);
    setTempName(event.value.name);
    setIsAddressReady(event.complete);
  };

  // NOUVELLE FONCTION: Déclenchée uniquement au clic du bouton "Valider l'adresse"
  const handleCalculateShipping = async () => {
    if (!isAddressReady || !tempAddress) return;

    // Validation simple du téléphone
    if (!phone || phone.length < 10) {
      alert('Veuillez entrer un numéro de téléphone valide pour la livraison.');
      return;
    }

    setIsLoading(true);
    setHasAttemptedShippingRatesFetch(true);

    try {
      const address = tempAddress;
      // Prepare address payload matching our API schema
      const addressPayload = {
        addressTo: {
          name: tempName || 'Valued Customer', // Stripe Element nuance
          street1: address.line1,
          street2: address.line2 || '',
          city: address.city,
          state: address.state,
          zip: address.postal_code,
          country: address.country,
          email: userEmail || 'customer@example.com',
          phone: phone, // Envoi du téléphone explicite
        },
      };

      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressPayload),
      });

      const data = await response.json();

      if (data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        // Auto-select first rate
        const firstRate = data.rates[0];
        updatePaymentIntent(firstRate);
      } else {
        console.warn('No rates found:', data);
        setShippingRates([]);
        setSelectedRate(null);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      setShippingRates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (!stripe || !elements) return;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success`,
      },
    });

    if (result.error) {
      console.error(result.error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">{t.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Address Section */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              {t.shippingAddress}
            </h2>
            <AddressElement
              options={{ mode: 'shipping' }}
              onChange={handleAddressChange}
            />

            {/* Champ Téléphone Séparé */}
            <div className="mt-4">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Numéro de téléphone (Requis pour la livraison)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            {/* BOUTON DE VALIDATION DE L'ADRESSE */}
            <div className="mt-6">
              <button
                onClick={handleCalculateShipping}
                disabled={!isAddressReady || isLoading || !phone}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
                                    ${
                                      isAddressReady && !isLoading && phone
                                        ? 'bg-gray-900 hover:bg-gray-800 shadow-md'
                                        : 'bg-gray-300 cursor-not-allowed'
                                    }`}
              >
                {isLoading ? t.calculating : t.confirmAddress}
              </button>
            </div>
          </section>

          {/* Shipping Method Section - Only visible if we have attempted to fetch */}
          {hasAttemptedShippingRatesFetch && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                {t.shippingMethod}
              </h2>

              {isLoading ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                  <p className="text-gray-500">Calcul des frais de port...</p>
                </div>
              ) : shippingRates.length > 0 ? (
                <div className="space-y-3">
                  {shippingRates.map((rate: any, index: number) => {
                    const rateId = rate.object_id || rate.objectId;
                    const selectedId =
                      selectedRate?.object_id || selectedRate?.objectId;
                    const isSelected = selectedId === rateId;

                    // Debug styles: completely separate classes
                    const activeClasses =
                      'border-blue-600 bg-blue-50 ring-1 ring-blue-600 z-10';
                    const inactiveClasses =
                      'border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50';

                    return (
                      <div
                        key={rateId || index}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 mb-3 ${isSelected ? activeClasses : inactiveClasses}`}
                        onClick={() => updatePaymentIntent(rate)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {/* Radio Circle */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                                        ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-gray-900">
                                {rate.provider}
                              </div>
                              <div className="text-sm text-gray-600">
                                {rate.servicelevel.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900">
                              {rate.amount} {rate.currency}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {rate.duration_terms}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : hasAttemptedShippingRatesFetch ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">
                    Aucune option de livraison trouvée pour cette adresse.
                    Veuillez vérifier l'adresse ou contacter le support.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">
                    Veuillez saisir une adresse complète pour voir les options
                    de livraison.
                    <br />
                    <span className="text-xs text-gray-400">
                      (Pays, Rue, Ville, Province, Code Postal)
                    </span>
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Summary Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">
                {t.orderSummary}
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t.subtotal}</span>
                  <span className="font-medium text-gray-900">
                    {initialTotal.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t.shipping}</span>
                <span className="font-medium text-gray-900">
                  {selectedRate
                    ? `${selectedRate.amount} ${selectedRate.currency}`
                    : '--'}
                </span>
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="font-bold text-lg text-gray-900">
                    {t.totalToPay}
                  </span>
                  <span className="font-extrabold text-xl text-gray-900">
                    {total.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Section moved inside Summary or just below */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                {t.payment}
              </h3>
              <PaymentElement />
              <button
                className={`w-full mt-6 py-4 px-6 rounded-xl font-bold text-white text-lg shadow-md transition-all transform active:scale-[0.98]
                                        ${
                                          !stripe || !elements || !selectedRate
                                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                                        }`}
                disabled={!stripe || !elements || !selectedRate}
                onClick={handlePay}
              >
                {t.payNow}
              </button>
              <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
                Paiement sécurisé par Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
