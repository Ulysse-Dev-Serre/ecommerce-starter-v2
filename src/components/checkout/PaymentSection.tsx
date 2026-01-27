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
    <div className="mt-8 pt-8 border-t border-border animate-in fade-in duration-700">
      <h3 className="text-xl font-bold mb-6 text-foreground">{t('payment')}</h3>

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
        className={`w-full mt-8 py-4 px-8 rounded-xl font-bold text-lg shadow-xl transition-all transform active:scale-[0.98]
          ${
            !stripe || !elements || !selectedRate
              ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border shadow-none'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover hover:scale-[1.02] shadow-primary/20 hover:shadow-primary/30'
          }`}
        disabled={!stripe || !elements || !selectedRate}
        onClick={onPay}
      >
        <div className="flex items-center justify-center gap-3">
          {(!stripe || !elements || !selectedRate) && (
            <svg
              className="w-5 h-5 text-muted-foreground/50"
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

      <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-2 font-medium">
        <svg
          className="w-4 h-4 text-success"
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
