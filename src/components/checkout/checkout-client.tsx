'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import AddressAutocomplete from './AddressAutocomplete';
import { trackEvent } from '@/lib/analytics/tracker';
import { formatPrice } from '@/lib/utils/currency';

import { env } from '@/lib/env';
import { siteTokens } from '@/styles/themes/tokens';

// Initialisation de Stripe en dehors du composant pour éviter de le recharger à chaque render
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
    securePayment: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    selectState: string;
    statePlaceholder: string;
    validation: {
      phone: string;
    };
    geography: {
      CA: Record<string, string>;
      US: Record<string, string>;
    };
  };
  userEmail?: string | null | undefined;
  summaryItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: string;
    image?: string;
  }>;
}

export function CheckoutClient({
  cartId,
  locale,
  initialTotal,
  currency,
  translations: t,
  userEmail,
  summaryItems,
}: CheckoutClientProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const directVariantId = searchParams.get('directVariantId');
  const directQuantity = searchParams.get('directQuantity');

  // 1. Au chargement, on crée une PaymentIntent (ou Session) vide pour avoir le clientSecret
  // C'est nécessaire pour initialiser <Elements> de Stripe
  useEffect(() => {
    // Si mode direct, on prépare l'objet directItem
    const directItem =
      directVariantId && directQuantity
        ? {
            variantId: directVariantId,
            quantity: parseInt(directQuantity),
          }
        : undefined;

    // Create intent
    void fetch('/api/checkout/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartId,
        currency,
        locale, // Ajout du locale pour les e-mails transactionnels
        directItem, // Ajout du paramètre optionnel pour achat direct
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError('Failed to init payment');
      });
  }, [cartId, currency, directVariantId, directQuantity]);

  if (error)
    return (
      <div className="p-4 text-red-500">
        {t.error}: {error}
      </div>
    );
  if (!clientSecret) return <div className="p-4">{t.loading}</div>;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: siteTokens.colors.primary,
            colorText: siteTokens.colors.text,
            colorDanger: siteTokens.colors.error,
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Label': {
              color: siteTokens.colors.mutedForeground,
              fontWeight: '500',
            },
            '.Input': {
              borderColor: siteTokens.colors.border,
              color: siteTokens.colors.text,
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
        cartId={cartId}
        summaryItems={summaryItems}
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
    securePayment: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    selectState: string;
    statePlaceholder: string;
    validation: {
      phone: string;
    };
    geography: {
      CA: Record<string, string>;
      US: Record<string, string>;
    };
  };
  userEmail?: string | null | undefined;
  cartId: string;
  summaryItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: string;
    image?: string;
  }>;
}

function CheckoutForm({
  clientSecret,
  currency,
  locale,
  initialTotal,
  translations: t,
  userEmail,
  cartId,
  summaryItems,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    void trackEvent('begin_checkout', { cartId, currency, initialTotal });
  }, []);

  // New states for better UX/Debugging of shipping rates
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedShippingRatesFetch, setHasAttemptedShippingRatesFetch] =
    useState(false);

  // Timer ref for debounce (plus nécessaire avec le bouton manuel, mais on peut laisser pour nettoyage)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Ref to store the last address we successfully fetched rates for
  const lastFetchedAddress = useRef<string>('');

  // State pour stocker l'adresse en attente de validation
  const [tempAddress, setTempAddress] = useState<any>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CA',
  });
  const [tempName, setTempName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isAddressReady, setIsAddressReady] = useState(false);

  // Effet pour valider le formulaire manuellement
  useEffect(() => {
    const isReady =
      tempName?.trim() !== '' &&
      phone?.trim().length >= 10 &&
      tempAddress?.line1?.trim() !== '' &&
      tempAddress?.city?.trim() !== '' &&
      tempAddress?.state?.trim() !== '' &&
      tempAddress?.postal_code?.trim() !== '' &&
      tempAddress?.country?.trim() !== '';
    setIsAddressReady(isReady);
  }, [tempName, phone, tempAddress]);

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

  const updatePaymentIntent = async (
    rate: any,
    shippingDetailsArg?: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone: string;
    }
  ) => {
    try {
      setSelectedRate(rate);

      // Extract PaymentIntent ID from clientSecret
      const paymentIntentId = clientSecret.split('_secret_')[0];

      // S'assurer d'avoir des détails d'expédition valides
      // Priorité: argument passé > tempAddress du state
      const detailsToSend = shippingDetailsArg || {
        name: tempName || 'Valued Customer',
        street1: tempAddress.line1,
        street2: tempAddress.line2 || '',
        city: tempAddress.city,
        state: tempAddress.state,
        zip: tempAddress.postal_code,
        country: tempAddress.country,
        phone: phone, // Utiliser le state phone si non passé en argument
      };

      // AJOUT CRITIQUE: Inclure l'email pour le reçu Stripe (et notre DB)
      // Priorité: prop userEmail > rien
      const finalShippingDetails = {
        ...detailsToSend,
        email: userEmail,
      };

      const res = await fetch('/api/checkout/update-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          shippingRate: rate,
          currency,
          shippingDetails: finalShippingDetails, // Toujours envoyer un objet complet
        }),
      });
      const data = await res.json();
    } catch (err) {
      console.error('Failed to update shipping cost', err);
    }
  };

  // NOUVELLE FONCTION: Déclenchée uniquement au clic du bouton "Valider l'adresse"
  const handleCalculateShipping = async () => {
    if (!isAddressReady || !tempAddress) return;

    // Validation simple du téléphone
    if (!phone || phone.length < 10) {
      alert(t.validation.phone);
      return;
    }

    setIsLoading(true);
    setHasAttemptedShippingRatesFetch(true);

    try {
      // Format phone number to ensure it has '1' prefix for North America (NANP standard)
      // Remove any non-digit characters first to be clean
      // Avoid '+' which converts to '00' by Shippo and may be rejected by UPS for local routes
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('1')
        ? cleanPhone
        : `1${cleanPhone}`;

      const address = tempAddress;
      const addressPayload = {
        cartId: cartId,
        addressTo: {
          name: tempName || 'Valued Customer', // Stripe Element nuance
          street1: address.line1,
          street2: address.line2 || '',
          city: address.city,
          state: address.state,
          zip: address.postal_code,
          country: address.country,
          email: userEmail || 'customer@example.com',
          phone: formattedPhone, // Envoi du téléphone formaté E.164
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
        await updatePaymentIntent(firstRate);
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
            <div className="space-y-4">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.fullName} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.phone} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +1
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.addressLine1} <span className="text-red-500 ml-1">*</span>
                </label>
                <AddressAutocomplete
                  onAddressSelect={selected => {
                    setTempAddress({
                      ...tempAddress,
                      line1: selected.line1,
                      city: selected.city,
                      state: selected.state,
                      postal_code: selected.postal_code,
                      country: selected.country,
                    });
                  }}
                  onInputChange={val => {
                    setTempAddress({
                      ...tempAddress,
                      line1: val,
                    });
                  }}
                  value={tempAddress?.line1 || ''}
                  placeholder={t.addressLine1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  countryRestriction={
                    tempAddress?.country === 'US' ? 'us' : 'ca'
                  }
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.addressLine2}
                </label>
                <input
                  type="text"
                  value={tempAddress?.line2 || ''}
                  onChange={e =>
                    setTempAddress({ ...tempAddress, line2: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Country & City Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.country} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={tempAddress?.country || 'CA'}
                    onChange={e => {
                      // Reset state when country changes to avoid mismatch
                      setTempAddress({
                        ...tempAddress,
                        country: e.target.value,
                        state: '',
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="CA">Canada (CA)</option>
                    <option value="US">États-Unis (US)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.city} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempAddress?.city || ''}
                    onChange={e =>
                      setTempAddress({ ...tempAddress, city: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* State & Zip Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.state} <span className="text-red-500 ml-1">*</span>
                  </label>
                  {/* Dynamic State Selection */}
                  {tempAddress?.country === 'CA' ? (
                    <select
                      value={tempAddress?.state || ''}
                      onChange={e =>
                        setTempAddress({
                          ...tempAddress,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      <option value="">{t.selectState}</option>
                      {Object.entries(t.geography.CA).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : tempAddress?.country === 'US' ? (
                    <select
                      value={tempAddress?.state || ''}
                      onChange={e =>
                        setTempAddress({
                          ...tempAddress,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      <option value="">{t.selectState}</option>
                      {Object.entries(t.geography.US).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={tempAddress?.state || ''}
                      onChange={e =>
                        setTempAddress({
                          ...tempAddress,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.zipCode} <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={tempAddress?.postal_code || ''}
                    onChange={e =>
                      setTempAddress({
                        ...tempAddress,
                        postal_code: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
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
                        onClick={async () => {
                          // Format phone for Stripe (NANP standard "1XXXXXXXXXX")
                          const cleanPhone = phone.replace(/\D/g, '');
                          const stripePhone = cleanPhone.startsWith('1')
                            ? cleanPhone
                            : `1${cleanPhone}`;

                          await updatePaymentIntent(rate, {
                            name: tempName || 'Valued Customer',
                            street1: tempAddress.line1,
                            street2: tempAddress.line2 || '',
                            city: tempAddress.city,
                            state: tempAddress.state,
                            zip: tempAddress.postal_code,
                            country: tempAddress.country,
                            phone: stripePhone,
                          });
                        }}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-3">
                            {/* Radio Circle */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                                          ${isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-gray-900">
                                {rate.displayName || rate.servicelevel.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {rate.duration_terms || rate.displayTime}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900">
                              {formatPrice(rate.amount, rate.currency, locale)}
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
                    Veuillez vérifier l&apos;adresse ou contacter le support.
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
                {/* Items List */}
                {summaryItems && summaryItems.length > 0 && (
                  <div className="mb-6 space-y-4 overflow-y-auto max-h-[40vh] pr-2">
                    {summaryItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        {/* Image Container */}
                        <div className="relative h-16 w-16 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
                              <span className="text-[10px]">No image</span>
                            </div>
                          )}
                          <div className="absolute top-0 right-0 bg-gray-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                            {item.quantity}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatPrice(
                              item.price,
                              item.currency as any,
                              locale
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(
                              item.price * item.quantity,
                              item.currency as any,
                              locale
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-b border-gray-100 pt-2" />
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>{t.subtotal}</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(initialTotal, currency as any, locale)}
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
                    {formatPrice(total, currency as any, locale)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Section moved inside Summary or just below */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                {t.payment}
              </h3>
              <PaymentElement
                options={{
                  defaultValues: {
                    billingDetails: {
                      email: userEmail || undefined,
                    },
                  },
                }}
              />
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
                {t.securePayment}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
