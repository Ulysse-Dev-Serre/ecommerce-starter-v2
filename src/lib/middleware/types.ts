/**
 * Types partagés pour les middleware API
 * Centralise les définitions pour éviter les duplications
 */

import { NextResponse, NextRequest } from 'next/server';

/**
 * Handler type pour les routes API Next.js
 * Accepte request et arguments optionnels (routeContext, authContext, validatedData, etc.)
 */
export type ApiHandler = (
  request: NextRequest,
  ...args: unknown[]
) => Promise<NextResponse> | NextResponse;
