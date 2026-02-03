import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { UserWithBasicInfo } from '@/lib/types/domain/user';

/**
 * Récupère tous les utilisateurs avec informations de base
 * Utilisé pour l'admin user management
 *
 * @returns Liste des utilisateurs triée par date de création (desc)
 */
import { UserSearchInput } from '@/lib/validators/user';

/**
 * Récupère tous les utilisateurs avec filtres et pagination
 * Utilisé pour l'admin user management
 */
export async function getAllUsers(options: Partial<UserSearchInput> = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.role) {
    where.role = options.role;
  }

  if (options.search) {
    where.OR = [
      { firstName: { contains: options.search, mode: 'insensitive' } },
      { lastName: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Récupère le nombre total d'utilisateurs
 * Utilisé pour les health checks et statistiques
 *
 * @returns Nombre total d'utilisateurs
 */
export async function getUserCount(): Promise<number> {
  return prisma.user.count();
}

/**
 * Récupère un utilisateur par son ID de base de données
 *
 * @param id - ID de base de données (pas le clerkId)
 * @returns Utilisateur trouvé ou null
 */
export async function getUserById(
  id: string
): Promise<UserWithBasicInfo | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Récupère un utilisateur par son Clerk ID
 *
 * @param clerkId - ID Clerk de l'utilisateur
 * @returns Utilisateur complet ou null
 */
export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}
