import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  ClerkUserCreatedEvent,
  ClerkUserUpdatedEvent,
  ClerkUserDeletedEvent,
} from '@/lib/validators/clerk-webhook';

import { UserRole } from '@/generated/prisma';

/**
 * Service handling Clerk Webhook Events.
 * Strictly typed against Zod schemas.
 */
export class UserClerkService {
  /**
   * Handles user.created event
   */
  static async handleUserCreated(data: ClerkUserCreatedEvent) {
    const primaryEmail = data.email_addresses[0]?.email_address;
    if (!primaryEmail) {
      throw new Error('Missing email in Clerk payload');
    }

    const user = await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail,
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        imageUrl: data.image_url ?? '',
        role: data.public_metadata?.role ?? UserRole.CLIENT,
      },
    });

    logger.info({ userId: user.id }, 'User created via Clerk Webhook');
    return user;
  }

  /**
   * Handles user.updated event
   */
  static async handleUserUpdated(data: ClerkUserUpdatedEvent) {
    if (!data.id) throw new Error('Missing ID in update payload');

    const primaryEmail = data.email_addresses?.[0]?.email_address;

    const user = await prisma.user.update({
      where: { clerkId: data.id },
      data: {
        email: primaryEmail, // Only update if present
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
        role: data.public_metadata?.role,
        updatedAt: new Date(),
      },
    });

    logger.info({ userId: user.id }, 'User updated via Clerk Webhook');
    return user;
  }

  /**
   * Handles user.deleted event
   */
  static async handleUserDeleted(data: ClerkUserDeletedEvent) {
    if (!data.id) throw new Error('Missing ID in delete payload');

    const result = await prisma.user.deleteMany({
      where: { clerkId: data.id },
    });

    if (result.count > 0) {
      logger.info({ clerkId: data.id }, 'User deleted via Clerk Webhook');
    } else {
      logger.warn({ clerkId: data.id }, 'Delete ignored: User not found');
    }

    return result;
  }
}
