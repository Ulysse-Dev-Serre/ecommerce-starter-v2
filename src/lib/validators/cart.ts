import { z } from 'zod';

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
  anonymousId: z.string().optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartLineSchema = z.object({
  quantity: z.number().int().nonnegative(),
});

export type UpdateCartLineInput = z.infer<typeof updateCartLineSchema>;
