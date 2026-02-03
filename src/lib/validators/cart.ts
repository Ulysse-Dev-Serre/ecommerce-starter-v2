import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@/lib/config/site';

/**
 * Validateur pour le calcul du panier
 */
export const cartCalculationSchema = z.object({
  currency: z
    .string()
    .refine(val => SUPPORTED_CURRENCIES.includes(val as any), {
      message: `Invalid currency. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`,
    }),
});

export type CartCalculationInput = z.infer<typeof cartCalculationSchema>;

/**
 * Validateur pour l'ajout au panier
 */
export const addToCartSchema = z.object({
  variantId: z.string().min(1, 'ID de variante requis'),
  quantity: z.number().int().min(1, 'La quantité doit être au moins de 1'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

/**
 * Validateur pour la mise à jour d'une ligne
 */
export const updateCartLineSchema = z.object({
  quantity: z.number().int().min(1, 'La quantité doit être au moins de 1'),
});

export type UpdateCartLineInput = z.infer<typeof updateCartLineSchema>;
