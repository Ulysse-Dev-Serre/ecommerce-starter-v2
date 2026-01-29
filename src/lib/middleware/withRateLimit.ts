import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { logger } from '@/lib/core/logger';

interface RateLimitConfig {
  windowMs: number; // Fenêtre de temps en ms
  maxRequests: number; // Nombre max de requêtes
  message?: string;
}

// Stockage en mémoire des requêtes (simple pour début, à remplacer par Redis en prod)
const requestStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware de rate limiting simple
 * Pour production, utiliser Upstash Redis ou similaire
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
  } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Identifier l'utilisateur (IP ou userId si authentifié)
    const identifier = getIdentifier(req);
    const now = Date.now();
    const key = `${identifier}:${req.nextUrl.pathname}`;

    // Nettoyer les anciennes entrées périodiquement
    cleanupOldEntries(now);

    // Récupérer ou créer l'entrée
    let record = requestStore.get(key);

    if (!record || now > record.resetTime) {
      // Nouvelle fenêtre
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestStore.set(key, record);
      return null; // Pas de limite atteinte
    }

    // Incrémenter le compteur
    record.count++;

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

    // Limite pas encore atteinte
    return null;
  };
}

/**
 * Obtenir un identifiant unique pour le rate limiting
 */
function getIdentifier(req: NextRequest): string {
  // Priorité : userId Clerk > IP
  const clerkId = req.headers.get('x-clerk-user-id');
  if (clerkId) return `user:${clerkId}`;

  // IP depuis différents headers (selon le proxy/CDN)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] ?? realIp ?? 'unknown';

  return `ip:${ip}`;
}

/**
 * Nettoyer les entrées expirées (éviter fuite mémoire)
 */
function cleanupOldEntries(now: number): void {
  // Nettoyer toutes les 5 minutes
  const lastCleanup = (globalThis as any).__rateLimitLastCleanup ?? 0;
  if (now - lastCleanup < 5 * 60 * 1000) return;

  (globalThis as any).__rateLimitLastCleanup = now;

  let cleaned = 0;
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(
      {
        action: 'rate_limit_cleanup',
        cleaned,
        remaining: requestStore.size,
      },
      `Cleaned ${cleaned} expired rate limit entries`
    );
  }
}

/**
 * Middleware wrapper pour API routes
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  const rateLimiter = createRateLimiter(config);

  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
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
