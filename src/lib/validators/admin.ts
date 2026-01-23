import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['LOCAL_STOCK', 'DROPSHIPPER', 'OTHER']),
  incoterm: z.enum(['DDP', 'DDU']).default('DDU'),
  address: z.object({
    street1: z.string().min(1),
    street2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().length(2),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const createAttributeSchema = z.object({
  key: z.string().min(1),
  inputType: z.enum(['text', 'select', 'color']),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  translations: z
    .array(
      z.object({
        language: z.enum(['EN', 'FR']),
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .min(1),
});

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
