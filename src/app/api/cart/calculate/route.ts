import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SITE_CURRENCY } from '@/lib/config/site';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import {
  OptionalAuthContext,
  withOptionalAuth,
} from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { ApiContext } from '@/lib/middleware/types';
import { getOrCreateCart } from '@/lib/services/cart';
import { resolveCartIdentity } from '@/lib/services/cart/identity';
import {
  calculateCart,
  validateCartForCheckout,
  serializeCalculation,
  type Currency,
} from '@/lib/services/calculations';
import { cartCalculationSchema } from '@/lib/validators/cart';

/**
 * GET /api/cart/calculate
 * Calcule les totaux du panier pour une devise donnée
 */
async function calculateCartHandler(
  request: NextRequest,
  { auth }: ApiContext
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const authContext = auth as OptionalAuthContext;
  const { searchParams } = new URL(request.url);

  // 1. Validation de la devise
  const cookieStore = await cookies();
  const currencyParam = searchParams.get('currency');
  const currencyCookie = cookieStore.get('currency')?.value;

  const validationResult = cartCalculationSchema.safeParse({
    currency: currencyParam || currencyCookie || SITE_CURRENCY,
  });

  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: validationResult.error.issues[0].message,
        requestId,
      },
      { status: 400 }
    );
  }

  const { currency } = validationResult.data;

  // 2. Résolution de l'identité
  const { userId, anonymousId } = await resolveCartIdentity(authContext, false);

  if (!userId && !anonymousId) {
    return NextResponse.json(
      {
        success: true,
        requestId,
        data: {
          currency,
          items: [],
          subtotal: '0',
          itemCount: 0,
          calculatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  }

  // 3. Récupération et Calcul
  const cart = await getOrCreateCart(userId, anonymousId);

  if (cart.items.length === 0) {
    return NextResponse.json(
      {
        success: true,
        requestId,
        data: {
          currency,
          items: [],
          subtotal: '0',
          itemCount: 0,
          calculatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  }

  const calculation = calculateCart(cart, currency as Currency);
  const validation = validateCartForCheckout(cart, currency as Currency);

  logger.info(
    {
      requestId,
      cartId: cart.id,
      currency,
      subtotal: calculation.subtotal.toString(),
      itemCount: calculation.itemCount,
      valid: validation.valid,
    },
    'Cart calculation API called'
  );

  return NextResponse.json(
    {
      success: true,
      requestId,
      data: serializeCalculation(calculation),
      validation,
    },
    {
      status: 200,
      headers: { 'X-Request-ID': requestId },
    }
  );
}

export const GET = withError(
  withOptionalAuth(withRateLimit(calculateCartHandler, RateLimits.PUBLIC))
);
