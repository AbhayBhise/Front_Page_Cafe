import crypto from 'crypto';
import { BadRequest } from '../../lib/errors';

export interface PaymentResult {
  status: 'paid' | 'unpaid' | 'failed';
  ref: string;
  method: string;
}

/**
 * Simulated payment gateway.
 * - cash: collected at the counter -> stays "unpaid" until the order is completed
 * - card/upi/wallet: instantly authorised; a token ending in "fail" is rejected
 *   so the failure path can be exercised end to end.
 * Swap this module for a real Stripe/Razorpay integration without touching callers.
 */
export async function charge(input: {
  method: 'card' | 'upi' | 'wallet' | 'cash';
  amount: number;
  token?: string;
}): Promise<PaymentResult> {
  if (input.amount <= 0) throw BadRequest('Invalid payment amount');

  if (input.method === 'cash') {
    return { status: 'unpaid', ref: `cash_${crypto.randomBytes(6).toString('hex')}`, method: 'cash' };
  }

  // simulate network latency
  await new Promise((r) => setTimeout(r, 250));

  if (input.token && input.token.toLowerCase().endsWith('fail')) {
    return { status: 'failed', ref: `dcln_${crypto.randomBytes(6).toString('hex')}`, method: input.method };
  }

  return { status: 'paid', ref: `pay_${crypto.randomBytes(8).toString('hex')}`, method: input.method };
}

export async function refund(ref: string): Promise<{ status: 'refunded'; ref: string }> {
  await new Promise((r) => setTimeout(r, 150));
  return { status: 'refunded', ref: `rfnd_${ref}` };
}
