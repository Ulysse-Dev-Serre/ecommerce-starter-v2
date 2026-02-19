'use client';

import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
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
        className={`min-h-[60vh] flex items-center justify-center p-6 duration-500 ${VIBE_ANIMATION_FADE_IN}`}
      >
        <div className="p-4 max-w-md flex-grow">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-error opacity-80" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t('error')}
          </h1>
          <p className="text-muted-foreground mb-8 text-lg font-medium">
            {error}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="vibe-button-primary h-10 px-6 px-8"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  // UI POUR LES INVITÉS (GUESTS)
  if (isGuestSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 duration-500">
        <div className="p-4 max-w-md flex-grow">
          <div className="flex justify-center mb-6 relative">
            <CheckCircle
              className={`h-20 w-20 text-success duration-500 ${VIBE_ANIMATION_ZOOM_IN}`}
            />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4 text-3xl tracking-tight font-bold text-foreground">
            {t('title')}
          </h2>

          <p className="text-muted-foreground mb-8 text-lg font-medium text-xl text-muted-foreground">
            {t('guestMessage')}
          </p>

          <div className="vibe-flex flex flex-col gap-4 vibe-w-full vibe-max-w-xs vibe-mt-6">
            <a
              href="mailto:"
              className="vibe-button-primary w-full h-12 vibe-flex vibe-items-center vibe-justify-center gap-2"
            >
              <Mail className="vibe-w-5 vibe-h-5" />
              {t('checkEmail')}
            </a>

            <Link
              href={`/${locale}/shop`}
              className="vibe-button-secondary w-full h-12 vibe-flex vibe-items-center vibe-justify-center gap-2"
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
    <div className="min-h-[60vh] flex items-center justify-center p-6 duration-500">
      <div className="p-4 max-w-md flex-grow">
        <div className="flex justify-center mb-6 relative">
          {orderConfirmed ? (
            <CheckCircle
              className={`h-20 w-20 text-success duration-500 ${VIBE_ANIMATION_ZOOM_IN}`}
            />
          ) : (
            <Loader2 className="h-20 w-20 text-primary animate-spin" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-4 text-3xl tracking-tight font-bold text-foreground">
          {orderConfirmed ? t('redirecting') : t('processing')}
        </h2>

        <p className="text-muted-foreground mb-8 text-lg font-medium text-xl text-muted-foreground">
          {orderConfirmed ? t('title') : t('waitMessage')}
        </p>

        {!orderConfirmed && sessionId && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground border border-border/50 break-all">
            {t('sessionId')}: {sessionId}
          </div>
        )}
      </div>
    </div>
  );
}
