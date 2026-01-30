import { Redis } from '@upstash/redis';
import { env } from './env';
import { logger } from './logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetTime: number }>;
}

/**
 * In-memory implementation (Default for Dev/Small scale)
 */
class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, { value: any; expiresAt: number | null }>();
  private rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    let record = this.rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      record.count++;
    }

    this.rateLimitStore.set(key, record);
    return record;
  }

  /**
   * Periodically clear expired entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    for (const [key, record] of this.rateLimitStore.entries()) {
      if (now > record.resetTime) {
        this.rateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(
        { action: 'cache_cleanup', cleaned },
        `Cleaned ${cleaned} expired cache entries`
      );
    }
  }
}

/**
 * Redis implementation using Upstash (Recommended for Production/Scale)
 */
class RedisCacheProvider implements CacheProvider {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch (error) {
      logger.error({ error, key }, 'Redis get error');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { ex: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error({ error, key }, 'Redis set error');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Redis delete error');
    }
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetTime: number }> {
    try {
      const count = await this.client.incr(key);

      if (count === 1) {
        await this.client.pexpire(key, windowMs);
      }

      const ttl = await this.client.pttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl : windowMs);

      return { count, resetTime };
    } catch (error) {
      logger.error({ error, key }, 'Redis increment error');
      return { count: 1, resetTime: Date.now() + windowMs };
    }
  }
}

const isRedisConfigured =
  !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN;

let provider: CacheProvider;

if (isRedisConfigured) {
  provider = new RedisCacheProvider();
  logger.info(
    { service: 'cache', provider: 'redis' },
    'Redis Cache initialized'
  );
} else {
  const memoryProvider = new MemoryCacheProvider();
  provider = memoryProvider;

  if (typeof window === 'undefined') {
    setInterval(() => memoryProvider.cleanup(), 5 * 60 * 1000);
  }

  logger.info(
    { service: 'cache', provider: 'memory' },
    'Memory Cache initialized'
  );
}

export const cache = provider;
