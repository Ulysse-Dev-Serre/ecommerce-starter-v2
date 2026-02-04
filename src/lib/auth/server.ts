import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/core/db';
import { UserRole } from '@/generated/prisma';

/**
 * Reusable helper to ensure user is authenticated and is an Admin.
 * Checks both Clerk session and the database record as source of truth.
 *
 * @returns The unique internal database ID of the user
 * @throws Error if not authenticated or not an admin
 */
export async function requireAdmin(): Promise<string> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user.id;
}

/**
 * Reusable helper to ensure user is authenticated.
 *
 * @returns The unique internal database ID of the user
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }

  return user.id;
}
