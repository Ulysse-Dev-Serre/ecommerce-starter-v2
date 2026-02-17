import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { AuthContext, withAuth } from '@/lib/middleware/withAuth';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import {
  updateOrderStatus,
  sendRefundRequestAlert,
} from '@/lib/services/orders';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

async function refundRequestHandler(
  request: NextRequest,
  authContext: AuthContext
) {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  const userId = authContext.userId;

  const formData = await request.formData();
  const orderId = formData.get('orderId') as string;
  const reason = formData.get('reason') as string;
  const type = formData.get('type') as string;
  const file = formData.get('image') as File | null;

  if (!orderId || !reason) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'Missing required fields: orderId or reason',
      400
    );
  }

  // 1. Verify user and order ownership
  const [user, order] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    }),
    prisma.order.findUnique({
      where: { id: orderId },
    }),
  ]);

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
  }

  if (!order || order.userId !== user.id) {
    logger.warn({ orderId, userId, requestId }, 'Unauthorized refund attempt');
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Order not found or access denied',
      403
    );
  }

  // 2. Prepare status update
  const isCancellation = type === 'CANCELLATION';
  const newStatus = isCancellation ? 'CANCELLED' : 'REFUND_REQUESTED';
  const comment = isCancellation
    ? 'Annulation immédiate par le client.'
    : `Remboursement demandé : ${reason.substring(0, 500)}${file ? ' (Image jointe)' : ''}`;

  // 3. Update status (Sync logic including history)
  await updateOrderStatus({
    orderId: order.id,
    status: newStatus as any,
    comment,
    userId: user.id,
  });

  // 4. Send email alert via specialized service
  let attachments: any[] = [];
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: file.name,
      content: buffer,
    });
  }

  await sendRefundRequestAlert({
    orderNumber: order.orderNumber,
    customerName: `${user.firstName} ${user.lastName}`.trim() || 'Client',
    customerEmail: order.orderEmail || user.email,
    reason,
    hasAttachment: !!file,
    attachments,
  });

  return NextResponse.json({
    success: true,
    requestId,
  });
}

export const POST = withError(
  withAuth(withRateLimit(refundRequestHandler, RateLimits.STRICT))
);
