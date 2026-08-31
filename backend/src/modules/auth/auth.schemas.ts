import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z0-9]/, 'Include an uppercase letter or a number');

export const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email().toLowerCase(),
    password,
    phone: z.string().min(6).max(20).optional(),
    role: z.enum(['customer', 'owner']).default('customer'),
    cafe: z
      .object({
        name: z.string().min(2).max(120),
        phone: z.string().min(6).max(20).optional(),
        addressLine: z.string().max(200).optional(),
        city: z.string().max(80).optional(),
        state: z.string().max(80).optional(),
        postalCode: z.string().max(16).optional(),
        gstNumber: z.string().max(32).optional(),
        licenseNumber: z.string().max(64).optional(),
        description: z.string().max(500).optional(),
      })
      .optional(),
  })
  .refine((v) => v.role !== 'owner' || !!v.cafe, {
    message: 'Cafe details are required to register as an owner',
    path: ['cafe'],
  });

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(10) });

export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(6).max(20).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
