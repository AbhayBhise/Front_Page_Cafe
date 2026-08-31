import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1).max(60),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updateCategorySchema = categorySchema.partial();

export const itemSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  price: z.number().positive().max(100000),
  compareAtPrice: z.number().positive().max(100000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  prepMinutes: z.number().int().min(1).max(180).default(15),
});

export const updateItemSchema = itemSchema.partial().omit({ categoryId: true }).extend({
  categoryId: z.string().cuid().optional(),
});
