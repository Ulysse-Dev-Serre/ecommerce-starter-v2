// src/lib/logger.ts

// Configuration des niveaux par environnement
// Dans src/lib/logger.ts
const LOG_LEVELS = {
  development: process.env.LOG_LEVEL ? [process.env.LOG_LEVEL, 'warn', 'error'] : ['debug', 'info', 'warn', 'error'],
  production: ['warn', 'error'],
  test: ['error']
};

const currentEnv = process.env.NODE_ENV as keyof typeof LOG_LEVELS || 'development';
const allowedLevels = LOG_LEVELS[currentEnv];

// Fonction pour générer un ID unique
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Logger avec contrôle par environnement
const createLogger = () => {
  const shouldLog = (level: string) => allowedLevels.includes(level);
  
  const log = (level: 'info' | 'warn' | 'error' | 'debug', data: any, message?: string) => {
    if (!shouldLog(level)) return; // Skip si niveau pas autorisé
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'ecommerce-frontend',
      environment: currentEnv,
      ...(typeof data === 'object' ? data : { data }),
      message: message || data?.message || ''
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
          console.log(logString);
        }
    }
  };

  return {
    info: (data: any, message?: string) => log('info', data, message),
    warn: (data: any, message?: string) => log('warn', data, message),
    error: (data: any, message?: string) => log('error', data, message),
    debug: (data: any, message?: string) => log('debug', data, message),
    child: (context: any) => ({
      info: (data: any, message?: string) => log('info', { ...context, ...data }, message),
      warn: (data: any, message?: string) => log('warn', { ...context, ...data }, message),
      error: (data: any, message?: string) => log('error', { ...context, ...data }, message),
      debug: (data: any, message?: string) => log('debug', { ...context, ...data }, message),
    })
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
export const createRequestLogger = (requestId?: string) => {
  const id = requestId || generateId();
  return logger.child({ requestId: id });
};

// Helpers spécifiques respectant les niveaux
export const logUserAction = (action: string, context: Partial<LogContext>, message?: string) => {
  logger.info({
    ...context,
    action,
    category: 'user_action',
    requestId: context.requestId || generateId() // requestId obligatoire
  }, message || `User action: ${action}`);
};

export const logError = (error: Error | string, context: Partial<LogContext> = {}) => {
  logger.error({
    ...context,
    error: error instanceof Error ? error.message : error,
    category: 'error',
    requestId: context.requestId || generateId() // requestId obligatoire
  }, 'Application error');
};

export const logPerformance = (operation: string, duration: number, context: Partial<LogContext> = {}) => {
  const level = duration > 2000 ? 'warn' : 'info'; // Threshold plus élevé
  logger[level]({
    ...context,
    operation,
    duration,
    category: 'performance',
    requestId: context.requestId || generateId()
  }, `${operation}: ${duration}ms`);
};

// Logger spécial pour sécurité (toujours loggé)
export const logSecurity = (event: string, context: Partial<LogContext>) => {
  // Bypass des niveaux pour sécurité - toujours logué
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    service: 'ecommerce-frontend',
    category: 'security',
    event,
    ...context,
    requestId: context.requestId || generateId()
  };
  console.warn(JSON.stringify(logEntry));
};
