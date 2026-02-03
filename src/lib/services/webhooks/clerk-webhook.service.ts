import { UserRole, User } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { UserClerkService } from '../users/user-clerk.service';
import {
  userCreatedSchema,
  userUpdatedSchema,
  userDeletedSchema,
} from '@/lib/validators/clerk-webhook';
import { ClerkWebhookEventData } from '@/lib/types/domain/webhook';

/**
 * Traite l'événement user.created de Clerk
 */
export async function handleUserCreated(
  eventData: ClerkWebhookEventData
): Promise<User> {
  // Adaptation du payload générique vers le schéma Zod spécifique
  // Note: On pourrait aussi utiliser directement les validateurs ici
  const payload: any = {
    id: eventData.id,
    email_addresses: eventData.email_addresses,
    first_name: eventData.first_name,
    last_name: eventData.last_name,
    image_url: eventData.image_url,
    public_metadata: eventData.public_metadata,
  };

  return UserClerkService.handleUserCreated(payload);
}

/**
 * Traite l'événement user.updated de Clerk
 */
export async function handleUserUpdated(
  eventData: ClerkWebhookEventData
): Promise<User> {
  const payload: any = {
    id: eventData.id,
    first_name: eventData.first_name,
    last_name: eventData.last_name,
    image_url: eventData.image_url,
    public_metadata: eventData.public_metadata,
    email_addresses: eventData.email_addresses,
  };

  return UserClerkService.handleUserUpdated(payload);
}

/**
 * Traite l'événement user.deleted de Clerk
 */
export async function handleUserDeleted(
  eventData: ClerkWebhookEventData
): Promise<{ count: number }> {
  const payload: any = {
    id: eventData.id,
    deleted: true,
  };
  return UserClerkService.handleUserDeleted(payload);
}

/**
 * Traite un événement webhook Clerk selon son type
 * @deprecated Use UserClerkService directly or api/webhooks/clerk/route.ts logic
 */
export async function processClerkWebhook(
  eventType: string,
  eventData: ClerkWebhookEventData
): Promise<User | { count: number } | null> {
  switch (eventType) {
    case 'user.created':
      return handleUserCreated(eventData);

    case 'user.updated':
      return handleUserUpdated(eventData);

    case 'user.deleted':
      return handleUserDeleted(eventData);

    default:
      logger.warn(
        { action: 'webhook_unhandled', eventType },
        `Unhandled Clerk webhook event type: ${eventType}`
      );
      return null;
  }
}
