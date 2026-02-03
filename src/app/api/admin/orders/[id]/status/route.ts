import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderStatus } from '@/generated/prisma';
import { withAdmin, AuthContext } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { withValidation } from '@/lib/middleware/withValidation';
import { updateOrderStatus } from '@/lib/services/orders/order-management.service';
import { sendStatusChangeEmail } from '@/lib/services/orders';
import { logger } from '@/lib/core/logger';

const statusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  comment: z.string().optional(),
});

type StatusUpdateRequest = z.infer<typeof statusUpdateSchema>;

async function handler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext,
  data: StatusUpdateRequest
) {
  const { id: orderId } = await context.params;
  const { status, comment } = data;

  // 1. Mise à jour via le service (gère les transitions et erreurs métier)
  const updatedOrder = await updateOrderStatus({
    orderId,
    status,
    comment,
    userId: authContext.userId,
  });

  // 2. Envoi de l'email (asynchrone, ne bloque pas la réponse)
  sendStatusChangeEmail(updatedOrder, status).catch(emailError => {
    logger.error(
      { error: emailError, orderId, status },
      'Failed to send status change email'
    );
  });

  return NextResponse.json({
    success: true,
    data: updatedOrder,
  });
}

export const PATCH = withError(
  withAdmin(
    withRateLimit(withValidation(statusUpdateSchema, handler), RateLimits.ADMIN)
  )
);
