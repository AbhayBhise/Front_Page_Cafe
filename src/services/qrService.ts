import { api } from '../lib/api';
import { FALLBACK_CAFES } from '../data/fallbackData';
import type { Cafe } from '../types';

export interface QrResolve {
  cafe: Pick<
    Cafe,
    'id' | 'name' | 'slug' | 'description' | 'logoUrl' | 'bannerUrl' | 'isOpen' | 'currency' | 'taxRate'
  > & { welcomeMessage?: string | null; announcement?: string | null };
  table: { id: string; label: string };
}

export interface QrSession extends QrResolve {
  token: string;
  guest: { id: string; name: string };
}

export const qrService = {
  resolve: async (body: { cafeSlug: string; tableCode: string; k: string }) => {
    try {
      return await (api.post('/qr/resolve', body) as unknown as Promise<{ data: QrResolve }>);
    } catch {
      const cafe =
        FALLBACK_CAFES.find((c) => c.slug === body.cafeSlug) || FALLBACK_CAFES[0];
      return {
        data: {
          cafe: {
            id: cafe.id,
            name: cafe.name,
            slug: cafe.slug,
            description: cafe.description,
            logoUrl: cafe.logoUrl,
            bannerUrl: cafe.bannerUrl,
            isOpen: cafe.isOpen,
            currency: cafe.currency,
            taxRate: cafe.taxRate,
            welcomeMessage: cafe.welcomeMessage,
            announcement: cafe.announcement,
          },
          table: { id: `tbl-${body.tableCode || '01'}`, label: `Table ${body.tableCode || '1'}` },
        },
      };
    }
  },

  startSession: async (body: { cafeSlug: string; tableCode: string; k: string }) => {
    try {
      return await (api.post('/qr/session', body) as unknown as Promise<{ data: QrSession }>);
    } catch {
      const res = await qrService.resolve(body);
      return {
        data: {
          ...res.data,
          token: 'demo-guest-session-token',
          guest: { id: 'guest-demo-user', name: 'Quick Dine Guest' },
        },
      };
    }
  },
};
