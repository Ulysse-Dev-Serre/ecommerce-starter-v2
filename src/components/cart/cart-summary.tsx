import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { NAV_ROUTES } from '@/lib/config/nav-routes';
import { VIBE_ANIMATION_FADE_IN } from '@/lib/config/vibe-styles';
import { CartPricing } from '@/lib/types/ui/cart';

import { PriceTotal } from '@/components/price-display';

interface CartSummaryProps {
  items: Array<{
    quantity: number;
    pricing: CartPricing[];
  }>;
  locale: string;
  _isSignedIn: boolean;
}

export function CartSummary({ items, locale, _isSignedIn }: CartSummaryProps) {
  const t = useTranslations('cart');
  const tCheckout = useTranslations('checkout');

  return (
    <div
      className={`vibe-card sticky top-4 duration-500 ${VIBE_ANIMATION_FADE_IN}`}
    >
      <h2 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-4">
        {t('total')}
      </h2>

      <div className="space-y-6 pt-2">
        <div className="flex justify-between items-center mb-6">
          <span className="vibe-form-label-meta">{t('total')}</span>
          <PriceTotal
            items={items}
            className="text-2xl font-bold text-foreground"
            locale={locale}
          />
        </div>

        <Link
          href={`/${locale}${NAV_ROUTES.CHECKOUT}`}
          className="vibe-button-primary w-full h-12"
          data-testid="checkout-button"
        >
          {t('checkout')}
        </Link>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
          <ShieldCheck className="h-4 w-4" />
          <span>{tCheckout('securePayment')}</span>
        </div>
      </div>
    </div>
  );
}
