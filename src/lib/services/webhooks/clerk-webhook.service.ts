import { UserRole, User } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import {
  createUserFromClerk,
  upsertUserFromClerk,
  deleteUserByClerkId,
} from '../users';
import { ClerkWebhookEventData } from '@/lib/types/domain/webhook';

/**
 * Détermine le rôle utilisateur depuis les données Clerk
 *
 * @param eventData - Données de l'événement Clerk
 * @returns Rôle utilisateur déterminé
 */
function determineUserRole(eventData: ClerkWebhookEventData): UserRole {
  // Chercher l'email primaire
  const primaryEmail = eventData.email_addresses?.find(
    email => email.id === eventData.primary_email_address_id
  );

  // Role par défaut
  let role: UserRole = UserRole.CLIENT;

  // Détecter admin par email (legacy)
  if (primaryEmail?.email_address.includes('admin')) {
    role = UserRole.ADMIN;
  }

  // Priorité aux métadonnées
  const metadataRole = eventData.public_metadata?.role;
  if (metadataRole && ['CLIENT', 'ADMIN'].includes(metadataRole)) {
    role = metadataRole as UserRole;
  }

  return role;
}

/**
 * Valide et extrait l'email primaire depuis les données Clerk
 *
 * @param eventData - Données de l'événement Clerk
 * @returns Email primaire
 * @throws Error si email primaire non trouvé
 */
function getPrimaryEmail(eventData: ClerkWebhookEventData): string {
  const primaryEmail = eventData.email_addresses?.find(
    email => email.id === eventData.primary_email_address_id
  );

  if (!primaryEmail) {
    throw new Error('Primary email not found');
  }

  return primaryEmail.email_address;
}

/**
 * Traite l'événement user.created de Clerk
 * Crée un nouvel utilisateur en base de données
 *
 * @param eventData - Données de l'événement
 * @returns Utilisateur créé
 */
export async function handleUserCreated(
  eventData: ClerkWebhookEventData
): Promise<User> {
  logger.info(
    {
      action: 'webhook_user_created',
      userId: eventData.id,
      email: eventData.email_addresses?.[0]?.email_address,
    },
    'Processing user.created webhook'
  );

  // Validation
  if (!eventData.id) {
    throw new Error('User ID is required');
  }

  const email = getPrimaryEmail(eventData);
  const role = determineUserRole(eventData);

  return createUserFromClerk({
    clerkId: eventData.id,
    email,
    firstName: eventData.first_name,
    lastName: eventData.last_name,
    imageUrl: eventData.image_url,
    role,
  });
}

/**
 * Traite l'événement user.updated de Clerk
 * Met à jour ou crée l'utilisateur en base de données
 *
 * @param eventData - Données de l'événement
 * @returns Utilisateur mis à jour
 */
export async function handleUserUpdated(
  eventData: ClerkWebhookEventData
): Promise<User> {
  logger.info(
    {
      action: 'webhook_user_updated',
      userId: eventData.id,
    },
    'Processing user.updated webhook'
  );

  if (!eventData.id) {
    throw new Error('User ID is required');
  }

  const email = getPrimaryEmail(eventData);
  const role = determineUserRole(eventData);

  return upsertUserFromClerk(eventData.id, {
    email,
    firstName: eventData.first_name,
    lastName: eventData.last_name,
    imageUrl: eventData.image_url,
    role,
  });
}

/**
 * Traite l'événement user.deleted de Clerk
 * Supprime l'utilisateur de la base de données
 *
 * @param eventData - Données de l'événement
 * @returns Résultat de la suppression
 */
export async function handleUserDeleted(
  eventData: ClerkWebhookEventData
): Promise<{ count: number }> {
  logger.info(
    {
      action: 'webhook_user_deleted',
      userId: eventData.id,
    },
    'Processing user.deleted webhook'
  );

  if (!eventData.id) {
    throw new Error('User ID is required');
  }

  return deleteUserByClerkId(eventData.id);
}

/**
 * Traite un événement webhook Clerk selon son type
 *
 * @param eventType - Type d'événement Clerk
 * @param eventData - Données de l'événement
 * @returns Résultat du traitement
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
        {
          action: 'webhook_unhandled',
          eventType,
        },
        `Unhandled Clerk webhook event type: ${eventType}`
      );
      return null;
  }
}
