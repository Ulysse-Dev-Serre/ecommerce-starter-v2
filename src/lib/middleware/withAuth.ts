/**
 * Middleware d'authentification pour les routes API
 *
 * ============================================
 * 🧪 BYPASS AUTHENTICATION POUR LES TESTS
 * ============================================
 *
 * Les tests d'intégration peuvent bypass l'authentification Clerk en utilisant
 * un header spécial d'API key de test.
 *
 * Configuration requise:
 * 1. Variable d'environnement: TEST_API_KEY=votre-clé-secrète-ici
 * 2. Header dans les requêtes de test: x-test-api-key: votre-clé-secrète-ici
 *
 * ⚠️ SÉCURITÉ:
 * - Fonctionne UNIQUEMENT en environnement de développement (NODE_ENV !== 'production')
 * - La clé doit être définie dans .env.local (ne JAMAIS committer)
 * - Désactivé automatiquement en production
 *
 * Exemple d'utilisation dans les tests:
 * ```javascript
 * const response = await client.get('/api/admin/attributes', {
 *   headers: { 'x-test-api-key': env.TEST_API_KEY }
 * });
 * ```
 *
 * Voir: tests/setup/auth.factory.js pour la fonction getTestAuthHeaders()
 * ============================================
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { env } from '@/lib/core/env';

import { UserRole } from '../../generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';

type ApiHandler = (...args: any[]) => Promise<NextResponse> | NextResponse;

export interface AuthContext {
  userId: string;
  clerkId: string;
  email: string;
  role: UserRole;
}

/**
 * Middleware pour protéger les routes API - utilisateur authentifié requis
 */
export function withAuth(handler: ApiHandler) {
  return async (
    request: Request,
    routeContext?: { params?: Promise<unknown> }
  ) => {
    try {
      // Pour les routes dynamiques, on doit passer routeContext entre request et authContext
      // ============================================
      // FIN DU BYPASS DE TEST
      // ============================================

      const { userId: clerkId } = await auth();

      if (!clerkId) {
        logger.warn(
          {
            action: 'unauthorized_access_attempt',
            path: (request as Request & { url?: string })?.url,
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

      return routeContext?.params
        ? await handler(request, routeContext, authContext)
        : await handler(request, authContext);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
        'Authentication middleware error'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message:
            env.NODE_ENV === 'development'
              ? errorMessage
              : 'Something went wrong',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware pour protéger les routes admin - rôle ADMIN requis
 */
export function withAdmin(handler: ApiHandler): ApiHandler {
  return withAuth(async (request: Request, ...args: unknown[]) => {
    // authContext est toujours le DERNIER argument (après routeContext pour routes dynamiques)
    const authContext = args[args.length - 1] as AuthContext;
    const routeContext =
      args.length > 1 ? (args[0] as { params?: Promise<unknown> }) : undefined;

    if (authContext.role !== UserRole.ADMIN) {
      logger.warn(
        {
          action: 'forbidden_access_attempt',
          userId: authContext.userId,
          role: authContext.role,
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

    // Passer routeContext si présent (pour routes dynamiques [id])
    return routeContext
      ? await handler(request, routeContext, authContext)
      : await handler(request, authContext);
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
export function withOptionalAuth(handler: ApiHandler) {
  return async (
    request: Request,
    routeContext?: { params?: Promise<unknown> }
  ) => {
    try {
      // Pour les routes dynamiques, on doit passer routeContext entre request et authContext
      // ============================================
      // FIN DU BYPASS DE TEST
      // ============================================

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

          return routeContext?.params
            ? await handler(request, routeContext, authContext)
            : await handler(request, authContext);
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

      return routeContext?.params
        ? await handler(request, routeContext, authContext)
        : await handler(request, authContext);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
        'Optional auth middleware error'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message:
            env.NODE_ENV === 'development'
              ? errorMessage
              : 'Something went wrong',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}
