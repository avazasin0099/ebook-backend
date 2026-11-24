import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    phone: z.string().min(1, 'Phone number is required').max(50),
    topic: z.string().min(1, 'Topic is required').max(255),
    message: z.string().min(1, 'Message is required'),
    submittedAt: z.union([z.string(), z.date()]).optional(),
  }),
});

export const updateContactStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'RESOLVED', 'ARCHIVED']),
    adminNotes: z.string().optional(),
  }),
});
