import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { logger } from '@/lib/core/logger';

interface RateLimitConfig {
  windowMs: number; // Fenêtre de temps en ms
  maxRequests: number; // Nombre max de requêtes
  message?: string;
}

import { cache } from '@/lib/core/cache';

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

    // Utilisation du service de cache centralisé
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

import { ApiHandler } from './types';

/**
 * Middleware wrapper pour API routes
 */
export function withRateLimit(handler: ApiHandler, config: RateLimitConfig) {
  const rateLimiter = createRateLimiter(config);

  return async (
    req: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse> => {
    const limitResponse = await rateLimiter(req);
    if (limitResponse) return limitResponse;

    return handler(req, ...args);
  };
}

/**
 * Configurations prédéfinies
 */
export const RateLimits = {
  // Routes publiques (products, cart GET)
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 req/min
  },

  // Routes d'écriture panier (add/update/delete)
  CART_WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 req/min
  },

  // Routes admin (product CRUD)
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 req/min
  },

  // Webhooks
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 req/min (Clerk peut envoyer plusieurs events)
  },

  // Très strict (login attempts, etc.)
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 req/15min
  },

  // Checkout Stripe (protéger contre abus)
  CHECKOUT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 checkouts/min max
  },

  // Order verification (polling)
  ORDER_VERIFY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 req/min (polling toutes les 2s pendant 60s)
  },
} as const;
