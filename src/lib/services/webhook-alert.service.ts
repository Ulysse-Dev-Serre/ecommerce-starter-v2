import { logger } from '../logger';

/**
 * Send message to Slack webhook
 */
async function sendSlackAlert(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('SLACK_WEBHOOK_URL not configured, skipping Slack alert');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, 'Failed to send Slack alert');
    }
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Error sending Slack alert'
    );
  }
}

export interface WebhookAlertPayload {
  webhookId: string;
  source: string;
  eventId: string;
  eventType: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  timestamp: Date;
}

/**
 * Send alert when webhook processing fails after max retries
 */
export async function alertWebhookFailure(
  alert: WebhookAlertPayload
): Promise<void> {
  const message = `
🚨 WEBHOOK ALERT: ${alert.source.toUpperCase()} Event Failed

Event ID: ${alert.eventId}
Event Type: ${alert.eventType}
Retry Count: ${alert.retryCount}/${alert.maxRetries}
Error: ${alert.error}
Time: ${alert.timestamp.toISOString()}

Action Required: Check webhook_events table for event ${alert.webhookId}
  `;

  logger.error(
    {
      webhookId: alert.webhookId,
      source: alert.source,
      eventId: alert.eventId,
      eventType: alert.eventType,
      retryCount: alert.retryCount,
      maxRetries: alert.maxRetries,
      error: alert.error,
    },
    'Webhook failed after max retries'
  );

  await sendSlackAlert(message);
}

/**
 * Send alert for invalid webhook signature
 */
export async function alertInvalidSignature(payload: {
  source: string;
  signature: string;
  error: string;
  timestamp: Date;
}): Promise<void> {
  const message = `
🔒 SECURITY ALERT: Invalid Webhook Signature

Source: ${payload.source.toUpperCase()}
Signature: ${payload.signature.substring(0, 20)}...
Error: ${payload.error}
Time: ${payload.timestamp.toISOString()}

Action: This could be a malicious attempt. Review logs.
  `;

  logger.error(
    {
      source: payload.source,
      error: payload.error,
    },
    'Invalid webhook signature detected'
  );

  await sendSlackAlert(message);
}
