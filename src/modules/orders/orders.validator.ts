import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    bookIds: z.array(z.string().uuid()).min(1, 'At least one book must be selected'),
    returnUrl: z.string().url().optional(),
  }),
});
