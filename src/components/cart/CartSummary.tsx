import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
} from '@/lib/vibe-styles';
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

        {isSignedIn ? (
          <Link
            href={`/${locale}/checkout`}
            className="vibe-button-primary vibe-btn-full-lg"
          >
            {t('checkout')}
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button className="vibe-button-primary vibe-btn-full-lg">
              {t('signInToCheckout')}
            </button>
          </SignInButton>
        )}

        <div className="vibe-security-badge">
          <ShieldCheck className="vibe-icon-xs" />
          <span>{tCheckout('securePayment')}</span>
        </div>
      </div>
    </div>
  );
}
