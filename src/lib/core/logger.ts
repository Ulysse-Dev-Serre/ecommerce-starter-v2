// src/lib/logger.ts
import { env } from './env';

// Configuration des niveaux par environnement
// Dans src/lib/logger.ts
const LOG_LEVELS = {
  development: env.LOG_LEVEL
    ? [env.LOG_LEVEL, 'warn', 'error']
    : ['debug', 'info', 'warn', 'error'],
  production: env.LOG_LEVEL
    ? [env.LOG_LEVEL, 'warn', 'error']
    : ['warn', 'error'],
  test: env.LOG_LEVEL ? [env.LOG_LEVEL, 'warn', 'error'] : ['error'],
};

const currentEnv = env.NODE_ENV ?? 'development';
const allowedLevels = LOG_LEVELS[currentEnv];

// Fonction pour générer un ID unique
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface Logger {
  info: (data: Record<string, unknown>, message?: string) => void;
  warn: (data: Record<string, unknown>, message?: string) => void;
  error: (data: Record<string, unknown>, message?: string) => void;
  debug: (data: Record<string, unknown>, message?: string) => void;
  child: (context: Record<string, unknown>) => Logger;
}

// Logger avec contrôle par environnement

// Liste des clés sensibles à masquer
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'stripe-signature',
  // 'email', // Décommenter si on veut masquer les emails, mais utile pour debug admin
];

// Fonction récursive de nettoyage
function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const redacted = { ...data };

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();

    // Si la clé est sensible, on masque la valeur
    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      // Récursion pour les objets imbriqués
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

const createLogger = (): Logger => {
  const shouldLog = (level: string): boolean => allowedLevels.includes(level);

  const log = (
    level: 'info' | 'warn' | 'error' | 'debug',
    data: Record<string, unknown>,
    message?: string
  ): void => {
    if (!shouldLog(level)) return; // Skip si niveau pas autorisé

    const safeData = redactSensitiveData(data); // <--- Nettoyage ici

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'ecommerce-frontend',
      environment: currentEnv,
      ...(typeof safeData === 'object' ? safeData : { data: safeData }),
      message: message ?? data?.message ?? '',
    };

    const logString = JSON.stringify(logEntry);

    // En production, utiliser console approprié
    switch (level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      default:
        if (currentEnv === 'development') {
          console.info(logString);
        }
    }
  };

  return {
    info: (data: Record<string, unknown>, message?: string) =>
      log('info', data, message),
    warn: (data: Record<string, unknown>, message?: string) =>
      log('warn', data, message),
    error: (data: Record<string, unknown>, message?: string) =>
      log('error', data, message),
    debug: (data: Record<string, unknown>, message?: string) =>
      log('debug', data, message),
    child: (context: Record<string, unknown>): Logger => ({
      info: (data: Record<string, unknown>, message?: string) =>
        log('info', { ...context, ...data }, message),
      warn: (data: Record<string, unknown>, message?: string) =>
        log('warn', { ...context, ...data }, message),
      error: (data: Record<string, unknown>, message?: string) =>
        log('error', { ...context, ...data }, message),
      debug: (data: Record<string, unknown>, message?: string) =>
        log('debug', { ...context, ...data }, message),
      child: (childContext: Record<string, unknown>): Logger =>
        createLogger().child({ ...context, ...childContext }),
    }),
  };
};

export const logger = createLogger();

// Types pour les logs
export interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  error?: Error | string;
  from?: string;
  to?: string;
  locale?: string;
  component?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  category?: 'user_action' | 'system' | 'error' | 'performance' | 'security';
}

// Helper pour créer un logger avec requestId obligatoire
export const createRequestLogger = (requestId?: string): Logger => {
  const id = requestId ?? generateId();
  return logger.child({ requestId: id });
};

// Helpers spécifiques respectant les niveaux
export const logUserAction = (
  action: string,
  context: Partial<LogContext>,
  message?: string
): void => {
  logger.info(
    {
      ...context,
      action,
      category: 'user_action',
      requestId: context.requestId ?? generateId(),
    },
    message ?? `User action: ${action}`
  );
};

export const logError = (
  error: Error | string,
  context: Partial<LogContext> = {}
): void => {
  logger.error(
    {
      ...context,
      error: error instanceof Error ? error.message : error,
      category: 'error',
      requestId: context.requestId ?? generateId(),
    },
    'Application error'
  );
};

export const logPerformance = (
  operation: string,
  duration: number,
  context: Partial<LogContext> = {}
): void => {
  const level = duration > 2000 ? 'warn' : 'info';
  logger[level](
    {
      ...context,
      operation,
      duration,
      category: 'performance',
      requestId: context.requestId ?? generateId(),
    },
    `${operation}: ${duration}ms`
  );
};

// Logger spécial pour sécurité (toujours loggé)
export const logSecurity = (
  event: string,
  context: Partial<LogContext>
): void => {
  // Bypass des niveaux pour sécurité - toujours logué
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    service: 'ecommerce-frontend',
    category: 'security',
    event,
    ...context,
    requestId: context.requestId ?? generateId(),
  };
  console.warn(JSON.stringify(logEntry));
};
