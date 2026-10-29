import { api, tokenStore } from '../lib/api';
import type { Identity } from '../types';
import { isStaticPreview, isOfflineError, mockRegister, mockLogin } from './mockStorage';

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
    if (isStaticPreview()) {
      return mockLogin(email, password);
    }
    try {
      const res = (await api.post('/auth/login', { email, password })) as unknown as { data: AuthResponse };
      return persist(res.data);
    } catch (error) {
      if (isOfflineError(error)) {
        return mockLogin(email, password);
      }
      throw error;
    }
  },

  async register(payload: RegisterPayload): Promise<Identity> {
    if (isStaticPreview()) {
      return mockRegister(payload);
    }
    try {
      const res = (await api.post('/auth/register', payload)) as unknown as { data: AuthResponse };
      return persist(res.data);
    } catch (error) {
      if (isOfflineError(error)) {
        return mockRegister(payload);
      }
      throw error;
    }
  },

  async me(): Promise<Identity> {
    if (isStaticPreview()) {
      const cached = authService.cachedIdentity();
      if (cached) return cached;
      return mockLogin('customer@frontpagecafe.com');
    }
    try {
      const res = (await api.get('/auth/me')) as unknown as { data: Identity };
      localStorage.setItem('fpc.identity', JSON.stringify(res.data));
      return res.data;
    } catch (error) {
      if (isOfflineError(error)) {
        const cached = authService.cachedIdentity();
        if (cached) return cached;
      }
      throw error;
    }
  },

  async updateProfile(patch: { name?: string; phone?: string | null; avatarUrl?: string | null }): Promise<Identity> {
    try {
      const res = (await api.patch('/auth/me', patch)) as unknown as { data: Identity };
      localStorage.setItem('fpc.identity', JSON.stringify(res.data));
      return res.data;
    } catch (error) {
      const cached = authService.cachedIdentity();
      if (cached) {
        const updated: Identity = {
          ...cached,
          user: { ...cached.user, ...patch, name: patch.name || cached.user.name },
        };
        localStorage.setItem('fpc.identity', JSON.stringify(updated));
        return updated;
      }
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      if (isOfflineError(error)) return;
      throw error;
    }
  },

  async sessions() {
    try {
      const res = (await api.get('/auth/sessions')) as unknown as { data: unknown[] };
      return res.data;
    } catch {
      return [];
    }
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.refresh;
    if (refreshToken && !isStaticPreview()) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        /* ignore */
      }
    }
    tokenStore.clear();
  },
};
