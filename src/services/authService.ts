import { api, tokenStore } from '../lib/api';
import type { Identity } from '../types';

interface AuthResponse extends Identity {
  accessToken: string;
  refreshToken: string;
}

function persist(res: AuthResponse) {
  tokenStore.set(res.accessToken, res.refreshToken);
  const identity: Identity = { user: res.user, cafe: res.cafe, staff: res.staff };
  localStorage.setItem('fpc.identity', JSON.stringify(identity));
  return identity;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'owner';
  cafe?: {
    name: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    gstNumber?: string;
    licenseNumber?: string;
    description?: string;
  };
}

export const authService = {
  cachedIdentity(): Identity | null {
    const raw = localStorage.getItem('fpc.identity');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Identity;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<Identity> {
    const res = (await api.post('/auth/login', { email, password })) as unknown as { data: AuthResponse };
    return persist(res.data);
  },

  async register(payload: RegisterPayload): Promise<Identity> {
    const res = (await api.post('/auth/register', payload)) as unknown as { data: AuthResponse };
    return persist(res.data);
  },

  async me(): Promise<Identity> {
    const res = (await api.get('/auth/me')) as unknown as { data: Identity };
    localStorage.setItem('fpc.identity', JSON.stringify(res.data));
    return res.data;
  },

  async updateProfile(patch: { name?: string; phone?: string | null; avatarUrl?: string | null }): Promise<Identity> {
    const res = (await api.patch('/auth/me', patch)) as unknown as { data: Identity };
    localStorage.setItem('fpc.identity', JSON.stringify(res.data));
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async sessions() {
    const res = (await api.get('/auth/sessions')) as unknown as { data: unknown[] };
    return res.data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        /* ignore */
      }
    }
    tokenStore.clear();
  },
};
