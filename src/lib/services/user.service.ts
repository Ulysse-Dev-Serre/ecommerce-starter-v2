import type { UserRole, User } from '../../generated/prisma'
import { prisma } from '../db/prisma'
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

type UserWithBasicInfo = Pick<User, 'id' | 'clerkId' | 'email' | 'firstName' | 'lastName' | 'imageUrl' | 'role' | 'createdAt' | 'updatedAt'>

/**
 * Get all users with basic information
 */
export async function getAllUsers(): Promise<UserWithBasicInfo[]> {
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
 * Get user by database ID (not clerkId)
 */
export async function getUserById(id: string): Promise<UserWithBasicInfo | null> {
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
    }
  })
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { clerkId },
  })
}

/**
 * Promote/demote user role (CLIENT ↔ ADMIN)
 */
export async function promoteUser(id: string, newRole: UserRole): Promise<UserWithBasicInfo> {
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { 
      role: newRole,
      updatedAt: new Date()
    },
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
    }
  })

  logger.info({
    action: 'user_role_updated',
    userId: id,
    newRole,
    email: updatedUser.email,
  }, `User role updated to ${newRole}`)

  return updatedUser
}

/**
 * Create user from Clerk webhook data
 */
export async function createUserFromClerk(userData: CreateUserData): Promise<User> {
  const user = await prisma.user.create({
    data: {
      clerkId: userData.clerkId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      imageUrl: userData.imageUrl,
      role: userData.role ?? UserRole.CLIENT,
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
export async function upsertUserFromClerk(clerkId: string, userData: UpdateUserData): Promise<User> {
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
export async function deleteUserByClerkId(clerkId: string): Promise<{ count: number }> {
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
