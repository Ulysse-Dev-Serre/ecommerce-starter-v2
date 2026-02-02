/**
 * Codes d'erreur API standardisés
 */
export enum ErrorCode {
  // Authentification
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Ressources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business Logic
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SHIPPING_NOT_AVAILABLE = 'SHIPPING_NOT_AVAILABLE',
  SHIPPING_DATA_MISSING = 'SHIPPING_DATA_MISSING',
  SHIPPING_RATE_ERROR = 'SHIPPING_RATE_ERROR',

  // Serveur
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Erreur API avec code et message
 */
export interface ApiError {
  code: ErrorCode | string;
  message: string;
  details?: unknown;
  field?: string; // Pour erreurs de validation
}

/**
 * Classe d'erreur personnalisée pour API
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode | string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
