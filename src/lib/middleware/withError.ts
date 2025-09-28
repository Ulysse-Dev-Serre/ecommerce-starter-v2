import { NextResponse } from 'next/server';

import { logger } from '../logger';

type ApiHandler = (...args: any[]) => Promise<NextResponse> | NextResponse;

export function withError(handler: ApiHandler) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
        'API Error'
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
