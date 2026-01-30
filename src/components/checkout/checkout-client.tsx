'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import AddressAutocomplete from './AddressAutocomplete';
import { trackEvent } from '@/lib/client/analytics';
import { formatPrice } from '@/lib/utils/currency';

import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { useToast } from '@/components/ui/toast-provider';
import { siteTokens } from '@/styles/themes/tokens';
import { CheckoutAddress } from '@/lib/types/ui/checkout';
import { ShippingRate } from '@/lib/integrations/shippo';
import {
  createPaymentIntent as createPaymentIntentAction,
  updatePaymentIntent as updatePaymentIntentAction,
} from '@/lib/client/checkout';
import { getShippingRates } from '@/lib/client/shipping';
import { NAV_ROUTES, CHECKOUT_URL_PARAMS } from '@/lib/config/nav-routes';

import { OrderSummary } from './OrderSummary';
import { AddressSection } from './AddressSection';
import { ShippingSection } from './ShippingSection';
import { PaymentSection } from './PaymentSection';

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
  const t = useTranslations('checkout');
  const { showToast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const directVariantId = searchParams.get(
    CHECKOUT_URL_PARAMS.DIRECT_VARIANT_ID
  );
  const directQuantity = searchParams.get(CHECKOUT_URL_PARAMS.DIRECT_QUANTITY);
  const initialized = useRef(false);

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

    if (initialized.current) return;
    initialized.current = true;

    // Create intent
    createPaymentIntentAction({
      cartId,
      currency,
      locale,
      directItem,
    })
      .then((data: any) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(t('errorInit'));
      })
      .catch(() => setError(t('errorInit')));
  }, [cartId, currency, directVariantId, directQuantity]);

  if (error)
    return (
      <div className="vibe-p-4 vibe-text-error">
        {t('error')}: {error}
      </div>
    );
  if (!clientSecret) return <div className="vibe-p-4">{t('loading')}</div>;

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
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const { showToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // STEP STATE: 'address' -> 'shipping' -> 'payment'
  const [step, setStep] = useState<'address' | 'shipping' | 'payment'>(
    'address'
  );

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

      await updatePaymentIntentAction({
        paymentIntentId,
        shippingRate: rate,
        currency,
        shippingDetails: finalShippingDetails,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to update shipping cost');
      showToast(t('errorShippingUpdate'), 'error');
    }
  };

  const handleCalculateShipping = async () => {
    if (!isAddressReady || !tempAddress) return;

    if (!phone || phone.length < 10) {
      showToast(t('validation.phone'), 'error');
      return;
    }

    setIsLoading(true);
    setHasAttemptedShippingRatesFetch(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('1')
        ? cleanPhone
        : `1${cleanPhone}`;

      const data = await getShippingRates(cartId, {
        name: tempName || t('anonymousCustomer'),
        street1: tempAddress.line1,
        street2: tempAddress.line2 || '',
        city: tempAddress.city,
        state: tempAddress.state,
        zip: tempAddress.postal_code,
        country: tempAddress.country,
        email: userEmail || '',
        phone: formattedPhone,
      });

      if (data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        // Move to shipping step
        setStep('shipping');
      } else {
        setShippingRates([]);
        setSelectedRate(null);
        // Stay on address step but show error maybe?
        showToast(t('noShippingRates'), 'error');
      }
    } catch (error) {
      logger.error({ error }, 'Error fetching rates');
      showToast(t('errorFetchingRates'), 'error');
      setShippingRates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelect = async (rate: ShippingRate) => {
    // Just select the rate locally, don't move step yet
    setSelectedRate(rate);
  };

  const handleConfirmShipping = async () => {
    if (!selectedRate) return;

    setIsLoading(true);
    const cleanPhone = phone.replace(/\D/g, '');
    const stripePhone = cleanPhone.startsWith('1')
      ? cleanPhone
      : `1${cleanPhone}`;

    await updatePaymentIntent(selectedRate, {
      name: tempName || t('anonymousCustomer'),
      street1: tempAddress.line1,
      street2: tempAddress.line2 || '',
      city: tempAddress.city,
      state: tempAddress.state,
      zip: tempAddress.postal_code,
      country: tempAddress.country,
      phone: stripePhone,
    });

    setIsLoading(false);
    setStep('payment');
  };

  const handleEditAddress = () => {
    setStep('address');
    setShippingRates([]);
    setSelectedRate(null);
    setHasAttemptedShippingRatesFetch(false);
  };

  const handleEditShipping = () => {
    setStep('shipping');
    // We keep selectedRate but user can change it
  };

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}${NAV_ROUTES.CHECKOUT_SUCCESS}`,
      },
    });

    if (result.error) {
      logger.error(
        { error: result.error },
        result.error.message || 'Payment error'
      );
      showToast(result.error.message || t('errorPayment'), 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="vibe-grid-layout">
      {/* Left Column: Address & Shipping */}
      <div className="vibe-grid-main-xl">
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
          readOnly={step !== 'address'}
          onEdit={handleEditAddress}
        />

        {step !== 'address' && (
          <div
            className={`vibe-mt-6 ${step === 'shipping' ? 'vibe-animate-fade-in' : ''}`}
          >
            <ShippingSection
              shippingRates={shippingRates}
              selectedRate={selectedRate}
              isLoading={isLoading}
              onRateSelect={handleRateSelect}
              locale={locale}
              readOnly={step === 'payment'}
              onEdit={handleEditShipping}
              onConfirm={handleConfirmShipping}
            />
          </div>
        )}
      </div>

      {/* Right Column: Summary & Payment */}
      <div className="vibe-grid-side-xl">
        <div className="vibe-checkout-sidebar">
          <OrderSummary
            summaryItems={summaryItems}
            initialTotal={initialTotal}
            total={total}
            currency={currency}
            locale={locale}
            selectedRate={selectedRate}
          />

          {step === 'payment' && (
            <div className="vibe-container-sm vibe-shadow-lg vibe-animate-fade-in">
              <PaymentSection
                stripe={stripe}
                elements={elements}
                selectedRate={selectedRate}
                onPay={handlePay}
                userEmail={userEmail}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
