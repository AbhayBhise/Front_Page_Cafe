import { api } from '../lib/api';
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
  resolve: (body: { cafeSlug: string; tableCode: string; k: string }) =>
    api.post('/qr/resolve', body) as unknown as Promise<{ data: QrResolve }>,

  startSession: (body: { cafeSlug: string; tableCode: string; k: string }) =>
    api.post('/qr/session', body) as unknown as Promise<{ data: QrSession }>,
};
