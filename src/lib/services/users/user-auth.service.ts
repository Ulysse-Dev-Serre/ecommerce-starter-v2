import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/core/db';
import { CurrentUser } from '@/lib/types/domain/user';

/**
 * Récupère l'utilisateur actuellement authentifié
 * Retourne null si non authentifié ou utilisateur non trouvé en DB
 *
 * @returns Utilisateur actuel avec informations de base ou null
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  return prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });
}
