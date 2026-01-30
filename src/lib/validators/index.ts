import { z } from 'zod';

/**
 * Formate les erreurs Zod en un tableau d'objets simple pour l'UI ou l'API
 */
export function formatZodErrors(
  error: z.ZodError
): { field: string; message: string }[] {
  const issues = error.issues || [];
  return issues.map(err => ({
    field: err.path?.join('.') || '',
    message: err.message,
  }));
}

// Re-export tous les validators pour un accès facile
export * from './cart';
export * from './checkout';
export * from './orders';
export * from './product';
export * from './shipping';
export * from './user';
export * from './admin';
