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
    <div className="border-t border-border pt-4 mt-4 duration-500 duration-700">
      <h3 className="text-2xl font-bold text-foreground mb-6 text-foreground">
        {t('payment')}
      </h3>

      <div className="bg-background p-4 rounded-xl border border-border shadow-inner">
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
        className={`vibe-button-primary w-full h-12 mt-8 uppercase tracking-wide
          ${!stripe || !elements || !selectedRate ? 'opacity-50 vibe-cursor-not-allowed vibe-shadow-none' : ''}`}
        disabled={!stripe || !elements || !selectedRate}
        data-testid="pay-now-button"
        onClick={onPay}
      >
        <div className="flex items-center justify-center gap-3">
          {(!stripe || !elements || !selectedRate) && (
            <Lock className="h-5 w-5 text-muted-foreground/50" />
          )}
          {t('payNow')}
        </div>
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-2 font-medium">
        <ShieldCheck className="h-4 w-4 text-success" />
        {t('securePayment')}
      </p>
    </div>
  );
}
