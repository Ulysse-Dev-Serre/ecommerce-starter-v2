import pino from 'pino';
import { randomUUID } from 'crypto';

// lib/logger.ts - Configuration de base
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Fonction helper pour créer un logger avec requestId
export const createRequestLogger = (requestId?: string) => {
  const id = requestId || randomUUID();
  return logger.child({ requestId: id });
};

// Type safety pour les logs
export interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  error?: Error;
  from?: string;
  to?: string;
}

export const logWithContext = (level: 'info' | 'warn' | 'error', context: LogContext, message: string) => {
  logger[level](context, message);
};

// Usage simple pour commencer
logger.info({ requestId: 'abc123' }, 'User action completed');
