import { NextResponse } from 'next/server';
import { z } from 'zod';

import { OrderStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { withAdmin } from '@/lib/middleware/withAuth';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import type { AuthContext } from '@/lib/middleware/withAuth';

// Workflow de transition d'état valide
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [], // État terminal
  [OrderStatus.REFUNDED]: [], // État terminal
};

const statusUpdateSchema = z.object({
  status: z.enum([
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ]),
  comment: z.string().optional(),
});

type StatusUpdatePayload = z.infer<typeof statusUpdateSchema>;

async function handler(
  request: Request,
  context: { params: Promise<{ id: string }> },
  authContext: AuthContext
) {
  const { id: orderId } = await context.params;

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    const bodyData = body as StatusUpdatePayload;

    // Validation du payload
    const validation = statusUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { status: newStatus, comment } = validation.data;

    // Récupérer la commande actuelle
    let order;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          orderNumber: true,
        },
      });
    } catch (prismaError) {
      // Si Prisma ne peut pas parser l'ID (format invalide), retourner 404
      logger.warn(
        {
          orderId,
          error:
            prismaError instanceof Error
              ? prismaError.message
              : 'Unknown error',
        },
        'Prisma error finding order'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Vérifier la transition d'état
    const validNextStates = VALID_STATUS_TRANSITIONS[order.status];
    if (!validNextStates.includes(newStatus)) {
      logger.warn(
        {
          orderId,
          currentStatus: order.status,
          requestedStatus: newStatus,
          validTransitions: validNextStates,
          userId: authContext.userId,
        },
        'Invalid status transition attempted'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status transition',
          message: `Cannot change status from ${order.status} to ${newStatus}. Valid transitions: ${validNextStates.join(', ') || 'none (terminal state)'}`,
        },
        { status: 400 }
      );
    }

    // Mettre à jour le statut via le service (qui gère l'envoi d'email pour SHIPPED)
    const { updateOrderStatus } = await import('@/lib/services/order.service');

    const updatedOrder = await updateOrderStatus(
      orderId,
      newStatus,
      comment,
      authContext.userId
    );

    logger.info(
      {
        orderId,
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        newStatus,
        updatedBy: authContext.userId,
        comment,
      },
      'Order status updated by admin'
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(
      {
        error: errorMessage,
        orderId: (await params).id,
        userId: authContext.userId,
      },
      'Error updating order status'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order status',
      },
      { status: 500 }
    );
  }
}

export const PATCH = withError(
  withAdmin(withRateLimit(handler, RateLimits.ADMIN))
);
