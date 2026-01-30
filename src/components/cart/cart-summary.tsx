import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
} from '@/lib/config/vibe-styles';
import { useTranslations } from 'next-intl';
import { PriceTotal } from '@/components/price-display';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { NAV_ROUTES } from '@/lib/config/nav-routes';

import { CartPricing } from '@/lib/types/ui/cart';

interface CartSummaryProps {
  items: Array<{
    quantity: number;
    pricing: CartPricing[];
  }>;
  locale: string;
  isSignedIn: boolean;
}

export function CartSummary({ items, locale, isSignedIn }: CartSummaryProps) {
  const t = useTranslations('cart');
  const tCheckout = useTranslations('checkout');

  return (
    <div className={`vibe-card vibe-sticky-side-4 ${VIBE_ANIMATION_FADE_IN}`}>
      <h2 className="vibe-section-title">{t('total')}</h2>

      <div className="vibe-sidebar-stack vibe-pt-2">
        <div className="vibe-flex-between-center vibe-mb-6">
          <span className="vibe-form-label-meta">{t('total')}</span>
          <PriceTotal
            items={items}
            className="vibe-text-price-xl"
            locale={locale}
          />
        </div>

        <Link
          href={`/${locale}${NAV_ROUTES.CHECKOUT}`}
          className="vibe-button-primary vibe-btn-full-lg"
        >
          {t('checkout')}
        </Link>

        <div className="vibe-security-badge">
          <ShieldCheck className="vibe-icon-xs" />
          <span>{tCheckout('securePayment')}</span>
        </div>
      </div>
    </div>
  );
}
