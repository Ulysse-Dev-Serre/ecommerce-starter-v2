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
  return async (...args: any[]) => {
    try {
      const { userId: clerkId } = await auth();

      if (!clerkId) {
        logger.warn(
          {
            action: 'unauthorized_access_attempt',
            path: args[0]?.url,
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

      return await handler(...args, authContext);
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
  return withAuth(async (...args: any[]) => {
    const authContext = args[args.length - 1] as AuthContext;

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

    return await handler(...args);
  });
}
