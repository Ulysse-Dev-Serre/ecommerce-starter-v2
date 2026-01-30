import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import {
  SITE_CURRENCY,
  SUPPORTED_CURRENCIES,
  CART_COOKIE_NAME,
} from '@/lib/config/site';

import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { getOrCreateCart } from '@/lib/services/cart';
import {
  calculateCart,
  validateCartForCheckout,
  serializeCalculation,
  type Currency,
} from '@/lib/services/calculations';

/**
 * GET /api/cart/calculate
 * Calcule les totaux du panier pour une devise donnée
 *
 * Query params:
 * - currency: CAD | USD (default: from cookie or CAD)
 */
async function calculateCartHandler(
  request: NextRequest
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  // Récupérer la devise depuis le query param ou le cookie
  const cookieStore = await cookies();
  const currencyParam = searchParams.get('currency');
  const currencyCookie = cookieStore.get('currency')?.value;
  const currency: Currency =
    (currencyParam as Currency) ||
    (currencyCookie as Currency) ||
    (SITE_CURRENCY as Currency);

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`,
        requestId,
      },
      { status: 400 }
    );
  }

  // Récupérer l'utilisateur
  const { userId: clerkId } = await auth();
  const anonymousId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!clerkId && !anonymousId) {
    return NextResponse.json(
      {
        success: false,
        error: 'No cart found',
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

  let userId: string | undefined;
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    userId = user?.id;
  }

  try {
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

    // Calculer les totaux
    const calculation = calculateCart(cart, currency);

    // Valider pour le checkout (optionnel, pour information)
    const validation = validateCartForCheckout(cart, currency);

    logger.info(
      {
        requestId,
        action: 'cart_calculate_api',
        cartId: cart.id,
        currency,
        subtotal: calculation.subtotal.toString(),
        itemCount: calculation.itemCount,
        valid: validation.valid,
      },
      'Cart calculation completed'
    );

    return NextResponse.json(
      {
        success: true,
        requestId,
        data: serializeCalculation(calculation),
        validation: {
          valid: validation.valid,
          errors: validation.errors,
        },
      },
      {
        status: 200,
        headers: {
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    logger.error(
      {
        requestId,
        action: 'cart_calculate_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Cart calculation failed'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate cart',
        requestId,
      },
      { status: 500 }
    );
  }
}

export const GET = withError(
  withRateLimit(calculateCartHandler, RateLimits.PUBLIC)
);
