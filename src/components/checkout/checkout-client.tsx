'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import AddressAutocomplete from './AddressAutocomplete';
import { trackEvent } from '@/lib/analytics/tracker';
import { formatPrice } from '@/lib/utils/currency';

import { env } from '@/lib/env';
import { siteTokens } from '@/styles/themes/tokens';
import { CheckoutAddress, ShippingRate } from '@/lib/types/checkout';

// Initialisation de Stripe en dehors du composant pour éviter de le recharger à chaque render
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutClientProps {
  cartId: string;
  locale: string;
  initialTotal: number;
  currency: string;
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
  userEmail,
  summaryItems,
}: CheckoutClientProps) {
  const t = useTranslations('Checkout');
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
        else setError(t('errorInit'));
      });
  }, [cartId, currency, directVariantId, directQuantity]);

  if (error)
    return (
      <div className="p-4 text-red-500">
        {t('error')}: {error}
      </div>
    );
  if (!clientSecret) return <div className="p-4">{t('loading')}</div>;

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

export function CheckoutForm({
  clientSecret,
  currency,
  locale,
  initialTotal,
  userEmail,
  cartId,
  summaryItems,
}: CheckoutFormProps) {
  const t = useTranslations('Checkout');
  const stripe = useStripe();
  const elements = useElements();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    void trackEvent('begin_checkout', { cartId, currency, initialTotal });
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedShippingRatesFetch, setHasAttemptedShippingRatesFetch] =
    useState(false);

  // States for address and contact
  const [tempAddress, setTempAddress] = useState<CheckoutAddress>({
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

  // Form validation
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

  const [total, setTotal] = useState(initialTotal);

  // Recalculate total when shipping rate changes
  useEffect(() => {
    if (selectedRate) {
      const shippingCost = parseFloat(selectedRate.amount);
      setTotal(initialTotal + shippingCost);
    } else {
      setTotal(initialTotal);
    }
  }, [selectedRate, initialTotal]);

  const updatePaymentIntent = async (
    rate: ShippingRate,
    shippingDetailsArg?: any
  ) => {
    try {
      setSelectedRate(rate);
      const paymentIntentId = clientSecret.split('_secret_')[0];

      const detailsToSend = shippingDetailsArg || {
        name: tempName || t('anonymousCustomer'),
        street1: tempAddress.line1,
        street2: tempAddress.line2 || '',
        city: tempAddress.city,
        state: tempAddress.state,
        zip: tempAddress.postal_code,
        country: tempAddress.country,
        phone: phone,
      };

      const finalShippingDetails = {
        ...detailsToSend,
        email: userEmail,
      };

      await fetch('/api/checkout/update-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          shippingRate: rate,
          currency,
          shippingDetails: finalShippingDetails,
        }),
      });
    } catch (err) {
      console.error('Failed to update shipping cost', err);
    }
  };

  const handleCalculateShipping = async () => {
    if (!isAddressReady || !tempAddress) return;

    if (!phone || phone.length < 10) {
      alert(t('validation.phone'));
      return;
    }

    setIsLoading(true);
    setHasAttemptedShippingRatesFetch(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('1')
        ? cleanPhone
        : `1${cleanPhone}`;

      const addressPayload = {
        cartId: cartId,
        addressTo: {
          name: tempName || t('anonymousCustomer'),
          street1: tempAddress.line1,
          street2: tempAddress.line2 || '',
          city: tempAddress.city,
          state: tempAddress.state,
          zip: tempAddress.postal_code,
          country: tempAddress.country,
          email: userEmail || '',
          phone: formattedPhone,
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
        const firstRate = data.rates[0];
        await updatePaymentIntent(firstRate);
      } else {
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

  const handleRateSelect = async (rate: ShippingRate) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const stripePhone = cleanPhone.startsWith('1')
      ? cleanPhone
      : `1${cleanPhone}`;

    await updatePaymentIntent(rate, {
      name: tempName || t('anonymousCustomer'),
      street1: tempAddress.line1,
      street2: tempAddress.line2 || '',
      city: tempAddress.city,
      state: tempAddress.state,
      zip: tempAddress.postal_code,
      country: tempAddress.country,
      phone: stripePhone,
    });
  };

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success`,
      },
    });

    if (result.error) {
      console.error(result.error.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="vibe-layout-container vibe-section-py">
      <h1 className="vibe-page-header">{t('title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Address & Shipping */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
          <AddressSection
            tempAddress={tempAddress}
            setTempAddress={setTempAddress}
            tempName={tempName}
            setTempName={setTempName}
            phone={phone}
            setPhone={setPhone}
            isAddressReady={isAddressReady}
            isLoading={isLoading}
            onCalculateShipping={handleCalculateShipping}
          />

          {hasAttemptedShippingRatesFetch && (
            <ShippingSection
              shippingRates={shippingRates}
              selectedRate={selectedRate}
              isLoading={isLoading}
              onRateSelect={handleRateSelect}
              locale={locale}
            />
          )}
        </div>

        {/* Right Column: Summary & Payment */}
        <div className="lg:col-span-12 xl:col-span-4 h-full">
          <div className="sticky top-8 space-y-6">
            <OrderSummary
              summaryItems={summaryItems}
              initialTotal={initialTotal}
              total={total}
              currency={currency}
              locale={locale}
              selectedRate={selectedRate}
            />

            <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
              <PaymentSection
                stripe={stripe}
                elements={elements}
                selectedRate={selectedRate}
                onPay={handlePay}
                userEmail={userEmail}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components are now in separate files for better maintainability.
import { OrderSummary } from './OrderSummary';
import { AddressSection } from './AddressSection';
import { ShippingSection } from './ShippingSection';
import { PaymentSection } from './PaymentSection';
