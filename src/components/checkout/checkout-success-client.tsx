'use client';

import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
} from '@/lib/config/vibe-styles';

import { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Mail,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { verifyOrder } from '@/lib/client/orders';
import { NAV_ROUTES } from '@/lib/config/nav-routes';
import { useUser } from '@clerk/nextjs';

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
  const redirectStatus = searchParams.get('redirect_status');

  const { isLoaded, isSignedIn } = useUser();

  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [isGuestSuccess, setIsGuestSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On attend que l'état d'auth soit chargé
    if (!isLoaded) return;

    // SCÉNARIO GUEST : On se fie au statut de redirection Stripe
    // On ne fait pas de polling API pour éviter les erreurs 500 sur /verify
    if (!isSignedIn) {
      if (redirectStatus === 'succeeded') {
        setOrderConfirmed(true);
        setIsGuestSuccess(true);
      }
      return;
    }

    // SCÉNARIO AUTHENTIFIÉ : On vérifie la commande et on redirige
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
          // Redirection uniquement pour les utilisateurs connectés
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
  }, [
    sessionId,
    paymentIntentId,
    locale,
    t,
    isLoaded,
    isSignedIn,
    redirectStatus,
  ]);

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

  // UI POUR LES INVITÉS (GUESTS)
  if (isGuestSuccess) {
    return (
      <div className="vibe-full-page-center vibe-animate-fade-in">
        <div className="vibe-status-container vibe-max-w-md vibe-flex-grow">
          <div className="vibe-status-icon-box vibe-relative">
            <CheckCircle
              className={`vibe-icon-xxxl vibe-text-success vibe-animate-zoom-in ${VIBE_ANIMATION_ZOOM_IN}`}
            />
          </div>

          <h2 className="vibe-status-title vibe-text-h1-status">
            {t('title')}
          </h2>

          <p className="vibe-status-desc vibe-text-p-status">
            {t('guestMessage')}
          </p>

          <div className="vibe-flex vibe-flex-col vibe-gap-4 vibe-w-full vibe-max-w-xs vibe-mt-6">
            <a
              href="mailto:"
              className="vibe-button-primary vibe-btn-full-lg vibe-flex vibe-items-center vibe-justify-center vibe-gap-2"
            >
              <Mail className="vibe-w-5 vibe-h-5" />
              {t('checkEmail')}
            </a>

            <Link
              href={`/${locale}/shop`}
              className="vibe-button-secondary vibe-btn-full-lg vibe-flex vibe-items-center vibe-justify-center vibe-gap-2"
            >
              <ShoppingBag className="vibe-w-5 vibe-h-5" />
              {t('backToShop')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UI DE CHARGEMENT / REDIRECTION (Authentifiés)
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
