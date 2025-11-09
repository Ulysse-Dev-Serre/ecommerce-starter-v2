/**
 * Version TEST du middleware withAuth
 * Utilisé automatiquement par Jest via mock dans jest.setup.js
 * 
 * ⚠️ NE PAS IMPORTER DIRECTEMENT - Jest le charge automatiquement
 */

import { NextResponse } from 'next/server';
import { UserRole } from '../../generated/prisma';

type ApiHandler = (...args: any[]) => Promise<NextResponse> | NextResponse;

export interface AuthContext {
  userId: string;
  clerkId: string;
  email: string;
  role: UserRole;
}

/**
 * Mock de withAuth pour les tests - injecte un utilisateur admin par défaut
 */
export function withAuth(handler: ApiHandler) {
  return async (...args: any[]) => {
    const mockAuthContext: AuthContext = {
      userId: 'cmhry6nwv0000ks0c2t1g2gnv',
      clerkId: 'user_35FXh55upbdX9L0zj1bjnrFCAde',
      email: 'ulyssebo255@gmail.com',
      role: UserRole.ADMIN,
    };

    return handler(...args, mockAuthContext);
  };
}

/**
 * Mock de withAdmin pour les tests - injecte un utilisateur admin
 */
export function withAdmin(handler: ApiHandler) {
  return withAuth(handler);
}
