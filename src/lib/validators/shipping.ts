import { z } from 'zod';

export const shippingRequestSchema = z.object({
  addressTo: z.object({
    name: z.string().optional().or(z.literal('')),
    street1: z.string().optional().or(z.literal('')),
    street2: z.string().optional(),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    zip: z.string(),
    country: z.string(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  cartId: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .optional(),
});

export type ShippingRequestInput = z.infer<typeof shippingRequestSchema>;
