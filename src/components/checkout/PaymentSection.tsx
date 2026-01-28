import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';

interface PaymentSectionProps {
  stripe: any;
  elements: any;
  selectedRate: any;
  onPay: () => void;
  userEmail?: string | null;
}

export function PaymentSection({
  stripe,
  elements,
  selectedRate,
  onPay,
  userEmail,
}: PaymentSectionProps) {
  const t = useTranslations('Checkout');
  return (
    <div className="vibe-section-divider-top vibe-animate-fade-in vibe-duration-700">
      <h3 className="vibe-text-price-xl vibe-mb-6 vibe-text-foreground">
        {t('payment')}
      </h3>

      <div className="vibe-input-group-container vibe-shadow-inner">
        <PaymentElement
          options={{
            defaultValues: {
              billingDetails: {
                email: userEmail || undefined,
              },
            },
          }}
        />
      </div>

      <button
        className={`vibe-button-primary vibe-btn-full-lg vibe-mt-8 vibe-uppercase vibe-tracking-wide
          ${!stripe || !elements || !selectedRate ? 'vibe-opacity-50 vibe-cursor-not-allowed vibe-shadow-none' : ''}`}
        disabled={!stripe || !elements || !selectedRate}
        onClick={onPay}
      >
        <div className="vibe-flex-center-gap-3">
          {(!stripe || !elements || !selectedRate) && (
            <svg
              className="vibe-icon-sm vibe-text-muted/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          )}
          {t('payNow')}
        </div>
      </button>

      <p className="vibe-text-xs-muted vibe-text-center vibe-mt-4 vibe-flex-center-gap-2 vibe-text-medium">
        <svg
          className="vibe-icon-xs vibe-text-success"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
        {t('securePayment')}
      </p>
    </div>
  );
}
