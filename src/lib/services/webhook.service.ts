import { UserRole, User } from '../../generated/prisma';
import { logger } from '@/lib/core/logger';
import {
  createUserFromClerk,
  upsertUserFromClerk,
  deleteUserByClerkId,
} from './user.service';

interface ClerkWebhookEventData {
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
 * Process Clerk user.created webhook event
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

  const primaryEmail = eventData.email_addresses?.find(
    email => email.id === eventData.primary_email_address_id
  );

  if (!primaryEmail) {
    throw new Error('Primary email not found');
  }

  // Determine role based on email or metadata
  let role: UserRole = UserRole.CLIENT;
  if (primaryEmail.email_address.includes('admin')) {
    role = UserRole.ADMIN;
  }

  // Get role from metadata if available
  const metadataRole = eventData.public_metadata?.role;
  if (metadataRole && ['CLIENT', 'ADMIN'].includes(metadataRole)) {
    role = metadataRole as UserRole;
  }

  return createUserFromClerk({
    clerkId: eventData.id,
    email: primaryEmail.email_address,
    firstName: eventData.first_name,
    lastName: eventData.last_name,
    imageUrl: eventData.image_url,
    role,
  });
}

/**
 * Process Clerk user.updated webhook event
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

  const primaryEmail = eventData.email_addresses?.find(
    email => email.id === eventData.primary_email_address_id
  );

  if (!primaryEmail) {
    throw new Error('Primary email not found');
  }

  // Determine role
  let role: UserRole = UserRole.CLIENT;
  const metadataRole = eventData.public_metadata?.role;
  if (metadataRole && ['CLIENT', 'ADMIN'].includes(metadataRole)) {
    role = metadataRole as UserRole;
  }

  return upsertUserFromClerk(eventData.id, {
    email: primaryEmail.email_address,
    firstName: eventData.first_name,
    lastName: eventData.last_name,
    imageUrl: eventData.image_url,
    role,
  });
}

/**
 * Process Clerk user.deleted webhook event
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
 * Process webhook event based on type
 */
export async function processWebhookEvent(
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
        `Unhandled webhook event type: ${eventType}`
      );
      return null;
  }
}
