import { NextResponse } from 'next/server';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import type { AuthContext } from '@/lib/middleware/withAuth';
import { ApiContext } from '@/lib/middleware/types';
import { NextRequest } from 'next/server';
import {
  previewShippingRates,
  purchaseShippingLabel,
} from '@/lib/services/orders/order-fulfillment.service';

/**
 * GET: Prévisualiser les tarifs (Admin)
 */
async function previewLabelHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const { id: orderId } = await params;
  const authContext = auth as AuthContext;

  // Note: withAdmin déjà checker, mais double-check si besoin
  if (authContext.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const rates = await previewShippingRates(orderId);

    // Formatage réponse (similaire à l'ancien comportement pour compatibilité front)
    // On renvoie le meilleur tarif par défaut pour l'UI simple, ou la liste complète si besoin plus tard
    const bestRate = rates[0];

    return NextResponse.json({
      amount: bestRate.amount,
      currency: bestRate.currency,
      provider: bestRate.provider,
      rateId: bestRate.object_id || bestRate.objectId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, orderId }, 'Error previewing shipping rates');
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === 'Order not found' ? 404 : 500 }
    );
  }
}

/**
 * POST: Acheter l'étiquette (Admin)
 */
async function purchaseLabelHandler(
  request: NextRequest,
  { params, auth }: ApiContext<{ id: string }>
): Promise<NextResponse> {
  const { id: orderId } = await params;
  const authContext = auth as AuthContext;

  if (authContext.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { rateId } = body;

    const result = await purchaseShippingLabel(orderId, rateId);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error, orderId }, 'Error purchasing shipping label');
    // Gestion d'erreur un peu plus fine basée sur le message
    const status =
      errorMessage === 'Order not found'
        ? 404
        : errorMessage === 'Label already exists'
          ? 400
          : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export const GET = withError(
  withAdmin(withRateLimit(previewLabelHandler, RateLimits.ADMIN))
);

export const POST = withError(
  withAdmin(withRateLimit(purchaseLabelHandler, RateLimits.ADMIN))
);
