import { NextResponse } from 'next/server';
import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

import { ApiHandler, ApiContext } from './types';

function isAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError ||
    (error !== null &&
      typeof error === 'object' &&
      'isAppError' in error &&
      (error as { isAppError: boolean }).isAppError === true)
  );
}

/**
 * Middleware de gestion globale des erreurs pour les routes API.
 * Capture les erreurs et retourne une réponse JSON formatée.
 */
export function withError(handler: ApiHandler): ApiHandler {
  return async (request, context: ApiContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (isAppError(error)) {
        const appError = error as AppError;
        logger.warn(
          {
            code: appError.code,
            message: appError.message,
            statusCode: appError.statusCode,
          },
          'AppError handled'
        );

        return NextResponse.json(
          {
            success: false,
            error: appError.code,
            message: appError.message,
            details: appError.details,
            timestamp: new Date().toISOString(),
          },
          { status: appError.statusCode }
        );
      }

      // 2. Gestion des erreurs de validation Zod (Fallback de sécurité)
      const { ZodError } = await import('zod');
      if (error instanceof ZodError) {
        const { formatZodErrors } = await import('@/lib/validators');
        logger.warn(
          {
            action: 'validation_error_fallback',
            errors: error.flatten(),
          },
          'ZodError caught by withError fallback'
        );

        return NextResponse.json(
          {
            success: false,
            error: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details: formatZodErrors(error),
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
        'Unhandled API Error'
      );

      return NextResponse.json(
        {
          success: false,
          error: ErrorCode.INTERNAL_SERVER_ERROR,
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
