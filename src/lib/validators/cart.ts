import { z } from 'zod';

import { SUPPORTED_CURRENCIES } from '@/lib/config/site';

/**
 * Validateur pour le calcul du panier
 */
export const cartCalculationSchema = z.object({
  currency: z.enum(SUPPORTED_CURRENCIES),
});

export type CartCalculationInput = z.infer<typeof cartCalculationSchema>;

/**
 * Validateur pour l'ajout au panier
 */
export const addToCartSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

/**
 * Validateur pour la mise à jour d'une ligne
 */
export const updateCartLineSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export type UpdateCartLineInput = z.infer<typeof updateCartLineSchema>;
