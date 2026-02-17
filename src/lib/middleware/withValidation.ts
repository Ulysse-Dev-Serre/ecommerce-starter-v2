import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { logger } from '@/lib/core/logger';
import { ApiHandler } from './types';
import { formatZodErrors } from '@/lib/validators';

/**
 * Middleware de validation Zod pour API Routes
 *
 * Parse le body de la requête et le valide contre un schéma Zod.
 * Passe les données validées comme DERNIER argument au handler.
 *
 * Usage:
 * export const POST = withValidation(MySchema, async (req, context, data) => { ... })
 * ou
 * export const POST = withValidation(MySchema, async (req, data) => { ... })
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ApiHandler<T>
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // 1. Parser le body (on doit cloner si on veut le relire ailleurs, mais ici on le consomme)
      // Note: On assume que c'est du JSON.
      const body = await request.json();

      // 2. Valider avec Zod
      const parseResult = await schema.safeParseAsync(body);

      if (!parseResult.success) {
        // Validation échouée
        const error = parseResult.error;

        logger.warn(
          {
            action: 'validation_error',
            errors: error.flatten(),
            path: request.nextUrl.pathname,
          },
          'API Validation Failed'
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Validation Error',
            details: formatZodErrors(error),
          },
          { status: 400 }
        );
      }

      // 3. Passer les données validées au handler
      // On ajoute 'data' à la fin des arguments existants (contexte de route, authContext, etc.)
      return await handler(request, ...args, parseResult.data);
    } catch (error) {
      // Erreur de parsing JSON ou autre
      logger.error(
        {
          action: 'validation_middleware_error',
          error: error instanceof Error ? error.message : 'Non-Error Object',
          stack: error instanceof Error ? error.stack : undefined,
          fullError: error,
        },
        'Middleware execution failed during service call'
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
