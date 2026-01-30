import { ApiError } from './errors';

/**
 * Réponse API générique
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * Métadonnées de réponse (pagination, etc.)
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
}

/**
 * Réponse API standardisée avec succès
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/**
 * Réponse API standardisée avec erreur
 */
export interface ErrorResponse {
  success: false;
  error: ApiError;
}
