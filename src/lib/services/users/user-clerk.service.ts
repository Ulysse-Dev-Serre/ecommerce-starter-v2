import { UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { CreateUserData, UpdateUserData } from '@/lib/types/domain/user';

/**
 * Crée un utilisateur depuis les données Clerk (webhook)
 *
 * @param userData - Données de l'utilisateur Clerk
 * @returns Utilisateur créé
 */
export async function createUserFromClerk(userData: CreateUserData) {
  const user = await prisma.user.create({
    data: {
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl,
      role: userData.role ?? UserRole.CLIENT,
    },
  });

  logger.info(
    {
      action: 'user_created',
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
    },
    'User created from Clerk webhook'
  );

  return user;
}

/**
 * Met à jour ou crée un utilisateur depuis Clerk
 * Utilisé pour synchroniser les données Clerk avec la base de données
 *
 * @param clerkId - ID Clerk de l'utilisateur
 * @param userData - Données à mettre à jour
 * @returns Utilisateur créé ou mis à jour
 */
export async function upsertUserFromClerk(
  clerkId: string,
  userData: UpdateUserData
) {
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl,
      role: userData.role,
      updatedAt: new Date(),
    },
    create: {
      clerkId,
      email: userData.email ?? '',
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl,
      role: userData.role ?? UserRole.CLIENT,
    },
  });

  logger.info(
    {
      action: 'user_upserted',
      userId: user.id,
      clerkId: user.clerkId,
    },
    'User upserted from Clerk webhook'
  );

  return user;
}

/**
 * Supprime un utilisateur par son Clerk ID
 * Utilisé lors de la suppression d'un compte Clerk (webhook)
 *
 * @param clerkId - ID Clerk de l'utilisateur à supprimer
 * @returns Résultat de la suppression
 */
export async function deleteUserByClerkId(
  clerkId: string
): Promise<{ count: number }> {
  const result = await prisma.user.deleteMany({
    where: { clerkId },
  });

  if (result.count > 0) {
    logger.info(
      {
        action: 'user_deleted',
        clerkId,
        count: result.count,
      },
      'User deleted from Clerk webhook'
    );
  } else {
    logger.warn(
      {
        action: 'user_delete_not_found',
        clerkId,
      },
      'Attempted to delete non-existent user'
    );
  }

  return result;
}
