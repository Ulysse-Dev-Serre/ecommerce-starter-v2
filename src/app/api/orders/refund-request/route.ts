import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { render } from '@react-email/render';

import { prisma } from '@/lib/core/db';
import { resend, FROM_EMAIL } from '@/lib/integrations/resend/client';
import { logger } from '@/lib/core/logger';
import { env } from '@/lib/core/env';
import RefundRequestAdminEmail from '@/components/emails/refund-request-admin';

import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

async function handler(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const orderId = formData.get('orderId') as string;
  const reason = formData.get('reason') as string;
  const file = formData.get('image') as File | null;

  if (!orderId || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Verify order ownership
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Prepare attachment if file exists
  let attachments = [];
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: file.name,
      content: buffer,
    });
  }

  const isCancellation = formData.get('type') === 'CANCELLATION';
  const newStatus = isCancellation ? 'CANCELLED' : 'REFUND_REQUESTED';

  // Mettre à jour le statut via le service centralisé
  const { updateOrderStatus } = await import('@/lib/services/orders');
  await updateOrderStatus({
    orderId: order.id,
    status: newStatus as any,
    comment: isCancellation
      ? `Annulation immédiate par le client.`
      : `Remboursement demandé : ${reason.substring(0, 500)}${file ? ' (Image jointe)' : ''}`,
    userId: user.id,
  });

  // Send email to admin
  const adminEmail = env.ADMIN_EMAIL;
  if (adminEmail) {
    const emailHtml = await render(
      RefundRequestAdminEmail({
        orderNumber: order.orderNumber,
        customerName: `${user.firstName} ${user.lastName}`.trim() || 'Client',
        customerEmail: user.email,
        reason: reason,
        imageUrl: file ? 'Attached' : undefined,
        locale: env.ADMIN_LOCALE || 'fr',
      })
    );

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `⚠️ Demande de remboursement - Commande ${order.orderNumber}`,
      html: emailHtml,
      attachments: attachments,
    });

    if (error) {
      logger.error(
        { error, orderId: order.id },
        'Failed to send refund request email to admin'
      );
    } else {
      logger.info({ orderId: order.id }, 'Refund request email sent to admin');
    }
  }

  return NextResponse.json({ success: true });
}

export const POST = withError(withRateLimit(handler, RateLimits.STRICT));
