import { NextResponse, NextRequest } from 'next/server';

import { AuthContext, OptionalAuthContext } from './withAuth';

/**
 * Interface globale pour le contexte des routes API.
 * Centralise tous les objets qui peuvent être injectés par les middlewares.
 *
 * @template TParams Type des paramètres de route (ex: { id: string })
 * @template TBody Type du corps de la requête validé (pour withValidation)
 */
export interface ApiContext<TParams = any, TBody = any> {
  params: Promise<TParams>;
  auth?: AuthContext | OptionalAuthContext;
  data?: TBody;
}

/**
 * Handler type pour les routes API Next.js.
 * Utilise ApiContext pour garantir un typage strict sans arguments positionnels.
 */
export type ApiHandler<TParams = any, TBody = any> = (
  request: NextRequest,
  context: ApiContext<TParams, TBody>
) => Promise<NextResponse> | NextResponse;
