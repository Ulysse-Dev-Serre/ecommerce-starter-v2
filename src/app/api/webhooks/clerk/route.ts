import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

import { logger } from '@/lib/core/logger';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';
import { ApiContext } from '@/lib/middleware/types';
import {
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema,
} from '@/lib/validators/clerk-webhook';
import { UserClerkService } from '@/lib/services/users/user-clerk.service';
import { env } from '@/lib/core/env';

const webhookSecret = env.CLERK_WEBHOOK_SECRET;

async function handleClerkWebhook(
  req: NextRequest,
  _context: ApiContext
): Promise<NextResponse> {
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

  // 2. Get headers (synchronous in Next.js App Router)
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

  // 3. Get RAW body (CRITICAL: Svix requires raw body for signature verification)
  let body: string;

  try {
    body = await req.text();
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Failed to read request body'
    );
    return NextResponse.json(
      { error: 'Failed to read request body' },
      { status: 400 }
    );
  }

  // 4. Verify signature BEFORE parsing
  const webhook = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;

    logger.info(
      {
        action: 'webhook_signature_verified',
        eventType: evt.type,
      },
      'Webhook signature verified'
    );
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Webhook signature verification failed'
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 5. Process the webhook event using Strict Validators
  try {
    const eventType = evt.type;
    const eventData = evt.data;

    switch (eventType) {
      case 'user.created':
        await UserClerkService.handleUserCreated(
          userCreatedSchema.parse(eventData)
        );
        break;
      case 'user.updated':
        await UserClerkService.handleUserUpdated(
          userUpdatedSchema.parse(eventData)
        );
        break;
      case 'user.deleted':
        await UserClerkService.handleUserDeleted(
          userDeletedSchema.parse(eventData)
        );
        break;
      default:
        logger.info({ eventType }, 'Unhandled webhook event type');
    }

    return NextResponse.json({
      success: true,
      eventType: evt.type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      {
        action: 'webhook_processing_failed',
        eventType: evt.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to process webhook event'
    );

    // Business logic errors (validation) should not trigger constant retries
    return NextResponse.json({
      success: false,
      error: 'Processing failed',
      eventType: evt.type,
    });
  }
}

export const POST = withError(
  withRateLimit(handleClerkWebhook, RateLimits.WEBHOOK)
);
