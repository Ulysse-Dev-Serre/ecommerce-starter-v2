import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { logger } from '@/lib/core/logger';
import { cache } from '@/lib/core/cache';
import { ApiHandler, ApiContext } from './types';

interface RateLimitConfig {
  windowMs: number; // Fenêtre de temps en ms
  maxRequests: number; // Nombre max de requêtes
  message?: string;
}

/**
 * Obtenir un identifiant unique pour le rate limiting
 */
function getIdentifier(req: NextRequest): string {
  const clerkId = req.headers.get('x-clerk-user-id');
  if (clerkId) return `user:${clerkId}`;

  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] ?? realIp ?? 'unknown';

  return `ip:${ip}`;
}

/**
 * Middleware de rate limiting
 * Utilise le service de cache pour supporter Memory (dev) ou Redis (prod)
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
  } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const identifier = getIdentifier(req);
    const key = `ratelimit:${identifier}:${req.nextUrl.pathname}`;

    const record = await cache.increment(key, windowMs);
    const now = Date.now();

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      logger.warn(
        {
          action: 'rate_limit_exceeded',
          identifier,
          path: req.nextUrl.pathname,
          count: record.count,
          maxRequests,
          retryAfter,
        },
        'Rate limit exceeded'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message,
          retryAfter,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
          },
        }
      );
    }

    return null;
  };
}

/**
 * Middleware wrapper pour API routes
 */
export function withRateLimit(
  handler: ApiHandler,
  config: RateLimitConfig
): ApiHandler {
  const rateLimiter = createRateLimiter(config);

  return async (
    req: NextRequest,
    context: ApiContext
  ): Promise<NextResponse> => {
    const limitResponse = await rateLimiter(req);
    if (limitResponse) return limitResponse;

    return handler(req, context);
  };
}

/**
 * Configurations prédéfinies
 */
export const RateLimits = {
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 60 },
  CART_WRITE: { windowMs: 60 * 1000, maxRequests: 50 },
  ADMIN: { windowMs: 60 * 1000, maxRequests: 30 },
  WEBHOOK: { windowMs: 60 * 1000, maxRequests: 100 },
  STRICT: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  CHECKOUT: { windowMs: 60 * 1000, maxRequests: 5 },
  ORDER_VERIFY: { windowMs: 60 * 1000, maxRequests: 30 },
} as const;
