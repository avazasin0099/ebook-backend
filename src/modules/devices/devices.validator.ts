import { z } from 'zod';

export const registerDeviceSchema = z.object({
  body: z.object({
    deviceIdentifier: z.string().min(1, 'Device identifier is required').max(255),
    deviceName: z.string().min(1, 'Device name is required').max(100),
    deviceModel: z.string().min(1, 'Device model is required').max(100),
    osVersion: z.string().max(50).optional(),
    appVersion: z.string().max(50).optional(),
    devicePublicKey: z.string().optional(),
  }),
});
