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
  return UserClerkService.handleUserCreated(eventData as any);
}

/**
 * Traite l'événement user.updated de Clerk
 */
export async function handleUserUpdated(
  eventData: ClerkWebhookEventData
): Promise<User> {
  return UserClerkService.handleUserUpdated(eventData as any);
}

/**
 * Traite l'événement user.deleted de Clerk
 */
export async function handleUserDeleted(
  eventData: ClerkWebhookEventData
): Promise<{ count: number }> {
  return UserClerkService.handleUserDeleted({
    id: eventData.id,
    deleted: true,
  });
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
