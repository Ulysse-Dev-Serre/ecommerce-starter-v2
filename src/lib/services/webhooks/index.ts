/**
 * Barrel export pour les services Webhooks
 * Point d'entrée centralisé pour tous les handlers de webhooks
 */

// Clerk Webhooks - Synchronisation utilisateurs
export * from './clerk-webhook.service';

// Webhook Alerts - Notifications Slack
export * from './webhook-alerts.service';

// Re-export des types pour faciliter l'import
export type {
  ClerkWebhookEventData,
  ClerkWebhookEventType,
  WebhookAlertPayload,
  InvalidSignatureAlert,
  WebhookSource,
} from '@/lib/types/domain/webhook';
