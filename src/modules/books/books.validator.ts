import { z } from 'zod';

export const createBookSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(280),
    subtitle: z.string().max(255).optional(),
    description: z.string().min(1, 'Description is required'),
    isbn: z.string().max(30).optional(),
    language: z.string().max(20).default('en'),
    pageCount: z.number().int().positive().optional(),
    publishedDate: z.string().optional(),
    basePrice: z.number().nonnegative('Base price must be >= 0'),
    salePrice: z.number().nonnegative('Sale price must be >= 0'),
    currency: z.string().max(10).default('INR'),
    availableFormats: z.string().default('EPUB,PDF'),
    isFeatured: z.boolean().default(false),
    categoryIds: z.array(z.string().uuid()).optional(),
    authorIds: z.array(z.string().uuid()).optional(),
    publisherIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateBookSchema = z.object({
  body: z.object({
    title: z.string().max(255).optional(),
    slug: z.string().max(280).optional(),
    subtitle: z.string().max(255).optional(),
    description: z.string().optional(),
    isbn: z.string().max(30).optional(),
    language: z.string().max(20).optional(),
    pageCount: z.number().int().positive().optional(),
    publishedDate: z.string().optional(),
    basePrice: z.number().nonnegative().optional(),
    salePrice: z.number().nonnegative().optional(),
    currency: z.string().max(10).optional(),
    availableFormats: z.string().optional(),
    isFeatured: z.boolean().optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
    authorIds: z.array(z.string().uuid()).optional(),
    publisherIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  }),
});
