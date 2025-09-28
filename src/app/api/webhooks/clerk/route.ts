import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import { processWebhookEvent } from '../../../../lib/services/webhook.service';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

async function handleClerkWebhook(req: NextRequest): Promise<NextResponse> {
  logger.info(
    {
      action: 'clerk_webhook_received',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
    },
    'Clerk webhook received'
  );

  // 1. Verify webhook secret exists
  if (!webhookSecret) {
    logger.error(
      { action: 'webhook_secret_missing' },
      'CLERK_WEBHOOK_SECRET not configured'
    );
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // 2. Get headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn(
      {
        action: 'webhook_headers_missing',
        headers: {
          svixId: !!svixId,
          svixTimestamp: !!svixTimestamp,
          svixSignature: !!svixSignature,
        },
      },
      'Missing svix headers'
    );
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // 3. Get and parse body
  let payload: unknown;
  let body: string;

  try {
    payload = await req.json();
    body = JSON.stringify(payload);

    logger.info(
      {
        action: 'webhook_payload_parsed',
        eventType: (payload as any)?.type,
        userId: (payload as any)?.data?.id,
        email: (payload as any)?.data?.email_addresses?.[0]?.email_address,
      },
      'Webhook payload parsed'
    );
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Failed to parse webhook payload'
    );
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  // 4. Verify signature
  const webhook = new Webhook(webhookSecret);
  let evt: unknown;

  try {
    evt = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    logger.info(
      { action: 'webhook_signature_verified' },
      'Webhook signature verified'
    );
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Webhook signature verification failed'
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 5. Process the webhook event
  try {
    await processWebhookEvent((evt as any).type, (evt as any).data);

    logger.info(
      {
        action: 'webhook_processed_successfully',
        eventType: (evt as any).type,
        userId: (evt as any).data?.id,
      },
      'Webhook processed successfully'
    );

    return NextResponse.json({
      success: true,
      eventType: (evt as any).type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      {
        action: 'webhook_processing_failed',
        eventType: (evt as any).type,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to process webhook event'
    );

    // Don't throw - return 200 to prevent Clerk retries for business logic errors
    return NextResponse.json({
      success: false,
      error: 'Processing failed',
      eventType: (evt as any).type,
      timestamp: new Date().toISOString(),
    });
  }
}

export const POST = withError(handleClerkWebhook);
