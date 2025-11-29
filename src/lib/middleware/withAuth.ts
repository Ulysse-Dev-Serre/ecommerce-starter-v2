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
 *   headers: { 'x-test-api-key': process.env.TEST_API_KEY }
 * });
 * ```
 *
 * Voir: tests/setup/auth.factory.js pour la fonction getTestAuthHeaders()
 * ============================================
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { UserRole } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';

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
      // 🧪 BYPASS POUR LES TESTS (NON-PRODUCTION SEULEMENT)
      // ============================================
      // Vérifie si une API key de test est fournie dans les headers
      // Cela permet aux tests d'intégration de contourner l'authentification Clerk
      const testApiKey = request.headers.get('x-test-api-key');
      const testUserId = request.headers.get('x-test-user-id');

      logger.info(
        {
          action: 'test_bypass_check',
          hasTestApiKey: !!testApiKey,
          hasEnvKey: !!process.env.TEST_API_KEY,
          keysMatch: testApiKey === process.env.TEST_API_KEY,
          nodeEnv: process.env.NODE_ENV,
          testUserId: testUserId || 'default',
        },
        '🧪 Checking test bypass conditions'
      );

      if (
        testApiKey &&
        process.env.TEST_API_KEY &&
        testApiKey === process.env.TEST_API_KEY &&
        process.env.NODE_ENV !== 'production'
      ) {
        // Priorité au header x-test-user-id, sinon config .env
        const clerkTestUserId =
          testUserId ||
          process.env.CLERK_TEST_USER_ID ||
          'user_35FXh55upbdX9L0zj1bjnrFCAde';
        const testUser = await prisma.user.findUnique({
          where: { clerkId: clerkTestUserId },
          select: {
            id: true,
            clerkId: true,
            email: true,
            role: true,
          },
        });

        if (testUser) {
          const authContext: AuthContext = {
            userId: testUser.id,
            clerkId: testUser.clerkId,
            email: testUser.email,
            role: testUser.role,
          };

          logger.info(
            {
              action: 'test_api_key_used',
              userId: testUser.id,
              email: testUser.email,
            },
            '🧪 Test API key authentication used'
          );

          return routeContext?.params
            ? handler(request, routeContext, authContext)
            : handler(request, authContext);
        }
      }
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
            process.env.NODE_ENV === 'development'
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
      const testApiKey = request.headers.get('x-test-api-key');
      const testUserId = request.headers.get('x-test-user-id');
      const testAnonymousId = request.headers.get('x-test-anonymous-id');

      // ============================================
      // 🧪 BYPASS POUR LES TESTS (NON-PRODUCTION SEULEMENT)
      // ============================================
      if (
        testApiKey &&
        process.env.TEST_API_KEY &&
        testApiKey === process.env.TEST_API_KEY &&
        process.env.NODE_ENV !== 'production'
      ) {
        // Test mode: simuler utilisateur OU anonyme
        if (testAnonymousId) {
          // Simuler un utilisateur anonyme
          const authContext: OptionalAuthContext = {
            anonymousId: testAnonymousId,
            isAuthenticated: false,
          };

          logger.info(
            {
              action: 'test_anonymous_used',
              anonymousId: testAnonymousId,
            },
            '🧪 Test anonymous ID used'
          );

          // Pour routes dynamiques: passer routeContext, sinon juste authContext
          return routeContext?.params
            ? handler(request, routeContext, authContext)
            : handler(request, authContext);
        }

        // Simuler un utilisateur authentifié
        const clerkTestUserId =
          testUserId ||
          process.env.CLERK_TEST_USER_ID ||
          'user_35FXh55upbdX9L0zj1bjnrFCAde';

        const testUser = await prisma.user.findUnique({
          where: { clerkId: clerkTestUserId },
          select: {
            id: true,
            clerkId: true,
            email: true,
            role: true,
          },
        });

        if (testUser) {
          const authContext: OptionalAuthContext = {
            userId: testUser.id,
            clerkId: testUser.clerkId,
            email: testUser.email,
            role: testUser.role,
            isAuthenticated: true,
          };

          logger.info(
            {
              action: 'test_api_key_used',
              userId: testUser.id,
            },
            '🧪 Test API key authentication used (optional auth)'
          );

          return routeContext?.params
            ? handler(request, routeContext, authContext)
            : handler(request, authContext);
        }
      }
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
            process.env.NODE_ENV === 'development'
              ? errorMessage
              : 'Something went wrong',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}
