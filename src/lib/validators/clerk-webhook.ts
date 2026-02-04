import { z } from 'zod';
import { UserRole } from '@/generated/prisma';

// Helper for nullable fields often found in Clerk payloads
const nullableString = z.string().nullable().optional();

// 1. User Created Event Data
export const userCreatedSchema = z.object({
  id: z.string(),
  email_addresses: z.array(
    z.object({
      email_address: z.string().email(),
      id: z.string(),
    })
  ),
  first_name: nullableString,
  last_name: nullableString,
  image_url: nullableString,
  // Metadata often contains the role if assigned early
  public_metadata: z
    .object({
      role: z.nativeEnum(UserRole).optional(),
    })
    .optional(),
});

// 2. User Updated Event Data
export const userUpdatedSchema = userCreatedSchema.partial();

// 3. User Deleted Event Data
export const userDeletedSchema = z.object({
  id: z.string(),
  deleted: z.boolean().optional(),
});

// Types
export type ClerkUserCreatedEvent = z.infer<typeof userCreatedSchema>;
export type ClerkUserUpdatedEvent = z.infer<typeof userUpdatedSchema>;
export type ClerkUserDeletedEvent = z.infer<typeof userDeletedSchema>;
