import { NextResponse } from 'next/server';
import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

// Type helper pour éviter l'erreur de spread avec rest parameters
type AnyHandler = (...args: any[]) => Promise<NextResponse> | NextResponse;

export function withError(handler: AnyHandler): AnyHandler {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        logger.warn(
          {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
          },
          'AppError handled'
        );

        return NextResponse.json(
          {
            success: false,
            error: error.code,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
          },
          { status: error.statusCode }
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
