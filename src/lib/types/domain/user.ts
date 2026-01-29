import { UserRole, User } from '@/generated/prisma';

/**
 * Données pour créer un utilisateur depuis Clerk
 */
export interface CreateUserData {
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  role?: UserRole;
}

/**
 * Données pour mettre à jour un utilisateur
 */
export interface UpdateUserData {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  role?: UserRole;
}

/**
 * Utilisateur avec informations de base
 */
export type UserWithBasicInfo = Pick<
  User,
  | 'id'
  | 'clerkId'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'imageUrl'
  | 'role'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Utilisateur actuel (authentifié)
 */
export interface CurrentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
}
