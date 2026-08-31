import { z } from 'zod';

export const listCafesQuery = z.object({
  q: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const updateCafeSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  welcomeMessage: z.string().max(280).nullable().optional(),
  announcement: z.string().max(200).nullable().optional(),
  phone: z.string().min(6).max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  addressLine: z.string().max(200).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  state: z.string().max(80).nullable().optional(),
  postalCode: z.string().max(16).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  gstNumber: z.string().max(32).nullable().optional(),
  licenseNumber: z.string().max(64).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  taxRate: z.number().min(0).max(30).optional(),
});

export const toggleOpenSchema = z.object({ isOpen: z.boolean() });

export const counterSchema = z.object({
  name: z.string().min(1).max(60),
  code: z.string().min(1).max(20).regex(/^[A-Za-z0-9-]+$/, 'Letters, numbers and dashes only'),
  isActive: z.boolean().default(true),
});

export const updateCounterSchema = counterSchema.partial();

export const createStaffSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
  title: z.string().max(60).default('Counter Staff'),
  counterId: z.string().cuid().nullable().optional(),
});

export const updateStaffSchema = z.object({
  title: z.string().max(60).optional(),
  counterId: z.string().cuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const rejectSchema = z.object({ reason: z.string().min(3).max(300) });

export const tableSchema = z.object({
  label: z.string().min(1).max(40),
  code: z.string().max(40).regex(/^[A-Za-z0-9-]*$/, 'Letters, numbers and dashes only').optional(),
});

export const updateTableSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  isActive: z.boolean().optional(),
});
