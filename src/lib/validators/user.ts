import { z } from 'zod';
import { UserRole } from '@/generated/prisma';

export const userSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export type UserSearchInput = z.infer<typeof userSearchSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  // Add other profile fields as needed
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
