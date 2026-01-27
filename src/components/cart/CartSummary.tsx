import { useTranslations } from 'next-intl';
import { PriceTotal } from '@/components/price-display';
import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { ShieldCheck } from 'lucide-react';

interface CartSummaryProps {
  items: Array<{
    quantity: number;
    pricing: Array<{
      price: string;
      currency: string;
    }>;
  }>;
  locale: string;
  isSignedIn: boolean;
}

export function CartSummary({ items, locale, isSignedIn }: CartSummaryProps) {
  const t = useTranslations('cart');
  const tCheckout = useTranslations('Checkout');

  return (
    <div className="vibe-card sticky top-4 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold mb-4 border-b border-border pb-4">
        {t('total')}
      </h2>

      <div className="space-y-6 pt-2">
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-medium text-muted-foreground">
            {t('total')}
          </span>
          <PriceTotal
            items={items}
            className="text-2xl font-bold text-foreground"
            locale={locale}
          />
        </div>

        {isSignedIn ? (
          <Link
            href={`/${locale}/checkout`}
            className="vibe-button-primary w-full h-12"
          >
            {t('checkout')}
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button className="vibe-button-primary w-full h-12">
              {t('signInToCheckout')}
            </button>
          </SignInButton>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
          <ShieldCheck className="h-4 w-4" />
          <span>{tCheckout('securePayment')}</span>
        </div>
      </div>
    </div>
  );
}
