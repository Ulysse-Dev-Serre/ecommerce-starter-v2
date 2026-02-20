import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';

import { logger } from '@/lib/core/logger';
import { formatZodErrors } from '@/lib/validators';

import { ApiHandler, ApiContext } from './types';

/**
 * Middleware de validation Zod pour API Routes.
 * Valide le corps de la requête et injecte les données dans context.data.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ApiHandler
): ApiHandler {
  return async (request: NextRequest, context: ApiContext) => {
    try {
      const body = await request.json();
      const parseResult = await schema.safeParseAsync(body);

      if (!parseResult.success) {
        logger.warn(
          {
            action: 'validation_error',
            errors: parseResult.error.flatten(),
            path: request.nextUrl.pathname,
          },
          'API Validation Failed'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            details: formatZodErrors(parseResult.error),
          },
          { status: 400 }
        );
      }

      return await handler(request, { ...context, data: parseResult.data });
    } catch (error) {
      logger.error(
        {
          action: 'validation_middleware_error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'Middleware execution failed during validation'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Request',
          message: 'Invalid JSON body',
        },
        { status: 400 }
      );
    }
  };
}
