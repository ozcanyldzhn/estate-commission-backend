import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
