/**
 * Requête API générique
 */
export interface ApiRequest<T = unknown> {
  body?: T;
  query?: Record<string, string | string[]>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Paramètres de query string standardisés
 */
export interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | undefined;
}
