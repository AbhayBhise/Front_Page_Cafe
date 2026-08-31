import { z } from 'zod';

export const createOrderSchema = z.object({
  // omitted / ignored for QR quick-dine guests (server derives it from the session token)
  cafeId: z.string().cuid().optional(),
  items: z
    .array(z.object({ menuItemId: z.string().cuid(), quantity: z.number().int().min(1).max(50) }))
    .min(1, 'Add at least one item'),
  fulfillmentType: z.enum(['dine_in', 'takeaway']).default('takeaway'),
  tableNumber: z.string().max(12).optional(),
  notes: z.string().max(300).optional(),
  customerName: z.string().max(80).optional(),
  customerPhone: z.string().max(20).optional(),
  payment: z.object({
    method: z.enum(['card', 'upi', 'wallet', 'cash']),
    // simulated card / upi details — never stored
    token: z.string().max(64).optional(),
  }),
});

export const listMineQuery = z.object({
  status: z.enum(['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const cafeOrdersQuery = z.object({
  status: z.string().optional(), // comma-separated
  scope: z.enum(['active', 'today', 'all']).default('active'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const transitionSchema = z.object({
  status: z.enum(['accepted', 'preparing', 'ready', 'completed', 'rejected']),
  note: z.string().max(200).optional(),
});

export const cancelSchema = z.object({ reason: z.string().max(200).optional() });
