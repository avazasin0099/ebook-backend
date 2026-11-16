import { z } from 'zod';

export const issueLicenseSchema = z.object({
  body: z.object({
    bookId: z.string().uuid('Valid book ID is required'),
    deviceId: z.string().uuid('Valid device ID is required'),
    format: z.enum(['EPUB', 'PDF']).default('EPUB'),
  }),
});

export const renewLicenseSchema = z.object({
  body: z.object({
    licenseId: z.string().min(1, 'License ID is required'),
    deviceId: z.string().uuid('Valid device ID is required'),
  }),
});
