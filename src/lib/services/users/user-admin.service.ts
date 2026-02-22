import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { UserSearchInput } from '@/lib/validators/user';

import { UserRole, Prisma } from '@/generated/prisma';

/**
 * Récupère tous les utilisateurs avec filtres et pagination
 * Utilisé pour l'admin user management
 */
export async function getAllUsersAdmin(options: Partial<UserSearchInput> = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};

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

  try {
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
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
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
  } catch (error) {
    logger.error({ error, options }, 'Failed to fetch users for admin');
    throw error;
  }
}

/**
 * Récupère un utilisateur par ID pour l'admin
 */
export async function getUserByIdAdmin(id: string) {
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
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
    },
  });
}

/**
 * Met à jour le rôle d'un utilisateur
 */
export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    logger.info(
      { userId, role, action: 'update_user_role' },
      'User role updated'
    );
    return user;
  } catch (error) {
    logger.error({ userId, role, error }, 'Failed to update user role');
    throw error;
  }
}

/**
 * Récupère les statistiques globales des clients pour le dashboard
 */
export async function getCustomerStatsAdmin() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now);
  thisWeek.setDate(now.getDate() - 7);
  const thisMonth = new Date(now);
  thisMonth.setMonth(now.getMonth() - 1);

  try {
    const [totalCount, newToday, newWeek, newMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    ]);

    return {
      totalCount,
      newToday,
      newWeek,
      newMonth,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to fetch customer stats');
    throw error;
  }
}
