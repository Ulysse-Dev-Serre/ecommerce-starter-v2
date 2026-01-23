import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  // Add other profile fields as needed
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
