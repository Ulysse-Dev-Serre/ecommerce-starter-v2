import { z } from 'zod';

import { SUPPORTED_CURRENCIES } from '@/lib/config/site';

export const createIntentSchema = z
  .object({
    cartId: z.string().optional(),
    currency: z
      .enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]])
      .optional(), // We accept it but backend MUST ignore it or validate against SITE_CURRENCY
    locale: z.string().optional(),
    directItem: z
      .object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
      .optional(),
  })
  .refine(data => data.cartId || data.directItem, {
    message: 'Either cartId or directItem must be provided',
    path: ['cartId'],
  });

export const updateIntentSchema = z.object({
  paymentIntentId: z.string().min(1),
  currency: z
    .enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]])
    .optional(),
  shippingRate: z
    .object({
      object_id: z.string().optional(),
      objectId: z.string().optional(),
      amount: z.string().or(z.number()),
    })
    .refine(
      data => data.object_id || data.objectId,
      'Shipping rate ID is required'
    ),
  shippingDetails: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10),
      street1: z.string().min(1),
      street2: z.string().optional().nullable(),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().length(2),
    })
    .optional(),
});

export type UpdateIntentInput = z.infer<typeof updateIntentSchema>;
export type CreateIntentInput = z.infer<typeof createIntentSchema>;
