import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { Lock, ShieldCheck } from 'lucide-react';

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
  const t = useTranslations('checkout');
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
            <Lock className="vibe-icon-sm vibe-text-muted/50" />
          )}
          {t('payNow')}
        </div>
      </button>

      <p className="vibe-text-xs-muted vibe-text-center vibe-mt-4 vibe-flex-center-gap-2 vibe-text-medium">
        <ShieldCheck className="vibe-icon-xs vibe-text-success" />
        {t('securePayment')}
      </p>
    </div>
  );
}
