import { z } from 'zod';

export const readingProgressSchema = z.object({
  body: z.object({
    bookId: z.string().uuid('Valid book ID is required'),
    locatorJson: z.string().min(1, 'Reading locator is required'),
    percentageComplete: z.number().min(0).max(100),
    currentPage: z.number().int().positive().optional(),
    totalPages: z.number().int().positive().optional(),
    deviceId: z.string().uuid().optional(),
  }),
});

export const bookmarkSchema = z.object({
  body: z.object({
    bookId: z.string().uuid('Valid book ID is required'),
    locatorJson: z.string().min(1, 'Reading locator is required'),
    title: z.string().max(255).optional(),
    note: z.string().optional(),
  }),
});
