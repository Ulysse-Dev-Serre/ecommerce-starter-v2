import { UserRole } from '@/generated/prisma';

/**
 * Types centralisés pour le domaine Webhooks
 * Utilisés par les handlers de webhooks (Clerk, Stripe, etc.)
 */

// ==================== Clerk Webhook Types ====================

/**
 * Structure de données d'un événement webhook Clerk
 */
export interface ClerkWebhookEventData {
  id: string;
  email_addresses?: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  public_metadata?: {
    role?: string;
  };
}

/**
 * Types d'événements Clerk supportés
 */
export type ClerkWebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted';

// ==================== Webhook Alert Types ====================

/**
 * Payload pour alerte d'échec de webhook
 */
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
 * Payload pour alerte de signature invalide
 */
export interface InvalidSignatureAlert {
  source: string;
  signature: string;
  error: string;
  timestamp: Date;
}

// ==================== Generic Webhook Types ====================

/**
 * Résultat générique de traitement webhook
 */
export interface WebhookProcessResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sources de webhook supportées
 */
export type WebhookSource = 'clerk' | 'stripe' | 'shippo' | 'other';

/**
 * Contexte d'exécution d'un webhook
 */
export interface WebhookContext {
  source: WebhookSource;
  eventId: string;
  eventType: string;
  timestamp: Date;
  retryCount?: number;
}
