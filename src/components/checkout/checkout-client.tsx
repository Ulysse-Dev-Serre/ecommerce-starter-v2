'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/client/analytics';

import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { useToast } from '@/components/ui/toast-provider';
import { siteTokens } from '@/styles/tokens';
import { CheckoutAddress } from '@/lib/types/ui/checkout';
import { ShippingRate, Address } from '@/lib/integrations/shippo';
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
import { SupportedCurrency } from '@/lib/config/site';

// Initialisation de Stripe en dehors du composant pour éviter de le recharger à chaque render
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutClientProps {
  cartId: string;
  locale: string;
  initialTotal: number;
  currency: SupportedCurrency;
  userEmail?: string | null | undefined;
  summaryItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: SupportedCurrency;
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const directVariantId = searchParams.get(
    CHECKOUT_URL_PARAMS.DIRECT_VARIANT_ID
  );
  const directQuantity = searchParams.get(CHECKOUT_URL_PARAMS.DIRECT_QUANTITY);
  const initialized = useRef(false);

  const directItem = useMemo(() => {
    return directVariantId && directQuantity
      ? {
          variantId: directVariantId,
          quantity: parseInt(directQuantity),
        }
      : undefined;
  }, [directVariantId, directQuantity]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    createPaymentIntentAction({
      cartId,
      currency,
      locale,
      directItem,
    })
      .then((data: { clientSecret?: string; error?: string }) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setError(data.error || t('errorInit'));
      })
      .catch(err => {
        logger.error({ err }, 'Checkout init error');
        setError(t('errorInit'));
      });
  }, [cartId, currency, directItem, locale, t]);

  if (error)
    return (
      <div className="p-4 text-error">
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
        locale: locale as import('@stripe/stripe-js').StripeElementLocale,
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
        directItem={directItem}
      />
    </Elements>
  );
}

interface CheckoutFormProps {
  clientSecret: string;
  currency: SupportedCurrency;
  locale: string;
  initialTotal: number;
  userEmail?: string | null | undefined;
  cartId: string;
  summaryItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: SupportedCurrency;
    image?: string;
  }>;
  directItem?: {
    variantId: string;
    quantity: number;
  };
}

export function CheckoutForm({
  clientSecret,
  currency,
  locale,
  initialTotal,
  userEmail,
  cartId,
  summaryItems,
  directItem,
}: CheckoutFormProps) {
  const t = useTranslations('checkout');
  const { showToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [_isProcessing, setIsProcessing] = useState(false);

  // STEP STATE: 'address' -> 'shipping' -> 'payment'
  const [step, setStep] = useState<'address' | 'shipping' | 'payment'>(
    'address'
  );

  useEffect(() => {
    void trackEvent('begin_checkout', { cartId, currency, initialTotal });
  }, [cartId, currency, initialTotal]);

  const [isLoading, setIsLoading] = useState(false);

  // States for address and contact
  const [tempAddress, setTempAddress] = useState<CheckoutAddress>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [tempName, setTempName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>(userEmail || '');
  const [isAddressReady, setIsAddressReady] = useState(false);

  // Form validation
  useEffect(() => {
    const isReady =
      tempName?.trim() !== '' &&
      phone?.trim().length >= 10 &&
      email?.trim() !== '' &&
      tempAddress?.line1?.trim() !== '' &&
      tempAddress?.city?.trim() !== '' &&
      tempAddress?.state?.trim() !== '' &&
      tempAddress?.zip?.trim() !== '' &&
      tempAddress?.country?.trim() !== '';
    setIsAddressReady(isReady);
  }, [tempName, phone, tempAddress, email]);

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
    shippingDetailsArg?: Record<string, string | null | undefined>
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
        zip: tempAddress.zip,
        country: tempAddress.country,
        phone: phone,
      };

      const finalShippingDetails: Address = {
        ...detailsToSend,
        email: email,
        zip: detailsToSend.zip || '',
        country: detailsToSend.country || '',
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

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('1')
        ? cleanPhone
        : `1${cleanPhone}`;

      const data = await getShippingRates(
        cartId,
        {
          name: tempName || t('anonymousCustomer'),
          street1: tempAddress.line1,
          street2: tempAddress.line2 || '',
          city: tempAddress.city,
          state: tempAddress.state,
          zip: tempAddress.zip,
          country: tempAddress.country,
          email: email || '',
          phone: formattedPhone,
        },
        directItem ? [directItem] : undefined
      );

      if (data.rates && data.rates.length > 0) {
        setShippingRates(data.rates);
        setStep('shipping');
      } else {
        setShippingRates([]);
        setSelectedRate(null);
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
      zip: tempAddress.zip,
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
  };

  const handleEditShipping = () => {
    setStep('shipping');
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-12 xl:col-span-8 space-y-8">
        <AddressSection
          tempAddress={tempAddress}
          setTempAddress={setTempAddress}
          tempName={tempName}
          setTempName={setTempName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          isAddressReady={isAddressReady}
          isLoading={isLoading}
          onCalculateShipping={handleCalculateShipping}
          readOnly={step !== 'address'}
          onEdit={handleEditAddress}
        />

        {step !== 'address' && (
          <div
            className={`vibe-mt-6 ${step === 'shipping' ? 'duration-500' : ''}`}
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

          {step === 'payment' && (
            <div className="max-w-sm mx-auto shadow-lg duration-500">
              <PaymentSection
                stripe={stripe}
                elements={elements}
                selectedRate={selectedRate}
                onPay={handlePay}
                userEmail={email}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
