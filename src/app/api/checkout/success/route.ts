import { NextRequest, NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { stripe } from '../../../../lib/stripe/client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id parameter' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logger.info(
      {
        requestId,
        sessionId,
        paymentStatus: session.payment_status,
      },
      'Checkout session retrieved'
    );

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
      },
    });
  } catch (error) {
    logger.error(
      {
        requestId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to retrieve checkout session'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to retrieve session',
      },
      { status: 500 }
    );
  }
}
