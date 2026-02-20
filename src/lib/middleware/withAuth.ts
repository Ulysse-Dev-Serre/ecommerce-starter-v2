/**
 * Middleware d'authentification pour les routes API
 * Fournit 3 modes :
 * - withAuth: Utilisateur authentifié requis
 * - withAdmin: Utilisateur avec rôle ADMIN requis
 * - withOptionalAuth: Authentification optionnelle (accepte anonymes)
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';

import { UserRole } from '../../generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { ApiHandler, ApiContext } from './types';

export interface AuthContext {
  userId: string;
  clerkId: string;
  email: string;
  role: UserRole;
}

/**
 * Middleware pour protéger les routes API - utilisateur authentifié requis
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      const { userId: clerkId } = await auth();

      if (!clerkId) {
        logger.warn(
          {
            action: 'unauthorized_access_attempt',
            path: request.url,
          },
          'Unauthorized: No Clerk user ID'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        logger.error(
          {
            action: 'user_not_found_in_db',
            clerkId,
          },
          'User authenticated in Clerk but not found in database'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'User not found',
            message: 'User account not properly synchronized',
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }

      const authContext: AuthContext = {
        userId: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      };

      logger.info(
        {
          action: 'authenticated_request',
          userId: user.id,
          role: user.role,
        },
        'Authenticated request'
      );

      return await handler(request, { ...context, auth: authContext });
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Middleware pour protéger les routes admin - rôle ADMIN requis
 */
export function withAdmin(handler: ApiHandler): ApiHandler {
  return withAuth(async (request: NextRequest, context: ApiContext) => {
    const authContext = context.auth as AuthContext;

    if (!authContext || authContext.role !== UserRole.ADMIN) {
      logger.warn(
        {
          action: 'forbidden_access_attempt',
          userId: authContext?.userId,
          role: authContext?.role,
          requiredRole: UserRole.ADMIN,
        },
        'Forbidden: Admin role required'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    logger.info(
      {
        action: 'admin_access_granted',
        userId: authContext.userId,
      },
      'Admin access granted'
    );

    return await handler(request, context);
  });
}

/**
 * Context pour authentification optionnelle (utilisateurs anonymes acceptés)
 */
export interface OptionalAuthContext {
  userId?: string;
  clerkId?: string;
  email?: string;
  role?: UserRole;
  anonymousId?: string;
  isAuthenticated: boolean;
}

/**
 * Middleware pour routes avec authentification optionnelle
 * Accepte les utilisateurs anonymes ET authentifiés
 * Utilisé pour: panier, checkout (invités autorisés)
 */
export function withOptionalAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      const { userId: clerkId } = await auth();

      if (clerkId) {
        // Utilisateur authentifié
        const user = await prisma.user.findUnique({
          where: { clerkId },
          select: {
            id: true,
            clerkId: true,
            email: true,
            role: true,
          },
        });

        if (user) {
          const authContext: OptionalAuthContext = {
            userId: user.id,
            clerkId: user.clerkId,
            email: user.email,
            role: user.role,
            isAuthenticated: true,
          };

          logger.info(
            {
              action: 'authenticated_optional_request',
              userId: user.id,
            },
            'Authenticated request (optional auth)'
          );

          return await handler(request, { ...context, auth: authContext });
        }
      }

      // Utilisateur anonyme - OK pour cette route
      const authContext: OptionalAuthContext = {
        isAuthenticated: false,
      };

      logger.info(
        {
          action: 'anonymous_request',
        },
        'Anonymous request (optional auth)'
      );

      return await handler(request, { ...context, auth: authContext });
    } catch (error) {
      throw error;
    }
  };
}
