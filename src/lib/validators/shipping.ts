import { z } from 'zod';

export const shippingRequestSchema = z.object({
  addressTo: z.object({
    name: z.string(),
    street1: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  cartId: z.string().optional(),
});

export type ShippingRequestInput = z.infer<typeof shippingRequestSchema>;
