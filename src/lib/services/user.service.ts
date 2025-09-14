import { prisma } from '../db/prisma'
import { UserRole } from '../../generated/prisma'
import { logger } from '../logger'

export interface CreateUserData {
  clerkId: string
  email: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  role?: UserRole
}

export interface UpdateUserData {
  email?: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  role?: UserRole
}

/**
 * Get all users with basic information
 */
export async function getAllUsers() {
  return prisma.user.findMany({
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
    orderBy: {
      createdAt: 'desc'
    }
  })
}

/**
 * Get user count for health checks
 */
export async function getUserCount(): Promise<number> {
  return prisma.user.count()
}

/**
 * Create user from Clerk webhook data
 */
export async function createUserFromClerk(userData: CreateUserData) {
  const user = await prisma.user.create({
    data: {
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl,
      role: userData.role || UserRole.CLIENT,
    },
  })

  logger.info({
    action: 'user_created',
    userId: user.id,
    clerkId: user.clerkId,
    email: user.email,
  }, 'User created from Clerk webhook')

  return user
}

/**
 * Update or create user from Clerk webhook data
 */
export async function upsertUserFromClerk(clerkId: string, userData: UpdateUserData) {
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
      email: userData.email || '',
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl,
      role: userData.role || UserRole.CLIENT,
    },
  })

  logger.info({
    action: 'user_upserted',
    userId: user.id,
    clerkId: user.clerkId,
  }, 'User upserted from Clerk webhook')

  return user
}

/**
 * Delete user by Clerk ID
 */
export async function deleteUserByClerkId(clerkId: string) {
  const result = await prisma.user.deleteMany({
    where: { clerkId },
  })

  if (result.count > 0) {
    logger.info({
      action: 'user_deleted',
      clerkId,
      count: result.count,
    }, 'User deleted from Clerk webhook')
  } else {
    logger.warn({
      action: 'user_delete_not_found',
      clerkId,
    }, 'Attempted to delete non-existent user')
  }

  return result
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
  })
}
