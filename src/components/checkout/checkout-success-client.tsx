'use client';

import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
} from '@/lib/config/vibe-styles';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { verifyOrder } from '@/lib/client/orders';
import { NAV_ROUTES } from '@/lib/config/nav-routes';

interface CheckoutSuccessClientProps {
  locale: string;
}

export function CheckoutSuccessClient({
  locale,
}: CheckoutSuccessClientProps): React.ReactElement {
  const t = useTranslations('checkoutSuccess');
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const identifier = sessionId || paymentIntentId;

    if (!identifier) {
      setError(t('noId'));
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    const checkOrder = async () => {
      try {
        const identifierToVerify = paymentIntentId || identifier;
        const data = await verifyOrder(identifierToVerify);

        if (data.exists && data.orderNumber) {
          setOrderConfirmed(true);
          setTimeout(() => {
            window.location.href = `/${locale}${NAV_ROUTES.ORDERS}/${data.orderNumber}`;
          }, 2000);
          return true;
        }

        return false;
      } catch (err) {
        console.error('Error verifying order:', err);
        return false;
      }
    };

    void checkOrder().then(confirmed => {
      if (confirmed) return;

      const interval = setInterval(async () => {
        attempts++;
        const confirmed = await checkOrder();
        if (confirmed || attempts >= maxAttempts) {
          clearInterval(interval);
          if (!confirmed && attempts >= maxAttempts) {
            setError(t('timeout'));
          }
        }
      }, 2000);

      return () => clearInterval(interval);
    });
  }, [sessionId, paymentIntentId, locale, t]);

  if (error) {
    return (
      <div
        className={`vibe-full-page-center vibe-animate-fade-in ${VIBE_ANIMATION_FADE_IN}`}
      >
        <div className="vibe-status-container vibe-max-w-md vibe-flex-grow">
          <div className="vibe-status-icon-box">
            <AlertCircle className="vibe-icon-xxl vibe-text-error-soft" />
          </div>
          <h1 className="vibe-status-title">{t('error')}</h1>
          <p className="vibe-status-desc">{error}</p>
          <Link
            href={`/${locale}/shop`}
            className="vibe-button-primary vibe-btn-sm-h10 vibe-px-8"
          >
            <ShoppingBag className="vibe-icon-sm" />
            {t('backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vibe-full-page-center vibe-animate-fade-in">
      <div className="vibe-status-container vibe-max-w-md vibe-flex-grow">
        <div className="vibe-status-icon-box vibe-relative">
          {orderConfirmed ? (
            <CheckCircle
              className={`vibe-icon-xxxl vibe-text-success vibe-animate-zoom-in ${VIBE_ANIMATION_ZOOM_IN}`}
            />
          ) : (
            <Loader2 className="vibe-icon-xxxl vibe-text-primary vibe-icon-spin" />
          )}
        </div>

        <h2 className="vibe-status-title vibe-text-h1-status">
          {orderConfirmed ? t('redirecting') : t('processing')}
        </h2>

        <p className="vibe-status-desc vibe-text-p-status">
          {orderConfirmed ? t('title') : t('waitMessage')}
        </p>

        {!orderConfirmed && sessionId && (
          <div className="vibe-status-code-box">
            {t('sessionId')}: {sessionId}
          </div>
        )}
      </div>
    </div>
  );
}
