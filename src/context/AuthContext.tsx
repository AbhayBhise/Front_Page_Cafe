import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authService, type RegisterPayload } from '../services/authService';
import { setSessionLostHandler, tokenStore } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';
import type { GuestContext, Identity, Role } from '../types';
import type { QrSession } from '../services/qrService';

interface AuthContextValue {
  identity: Identity | null;
  user: Identity['user'] | null;
  cafe: Identity['cafe'];
  role: Role | null;
  isGuest: boolean;
  guestContext: GuestContext | null;
  status: 'loading' | 'authed' | 'guest';
  login: (email: string, password: string) => Promise<Identity | null>;
  register: (payload: RegisterPayload) => Promise<Identity | null>;
  beginGuestSession: (session: QrSession) => Promise<Identity | null>;
  logout: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
  updateProfile: (patch: { name?: string; phone?: string | null; avatarUrl?: string | null }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readGuestCtx(): GuestContext | null {
  try {
    const raw = sessionStorage.getItem('fpc.guest');
    return raw ? (JSON.parse(raw) as GuestContext) : null;
  } catch {
    return null;
  }
}
const withGuest = (identity: Identity): Identity => ({ ...identity, guest: readGuestCtx() });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [identity, setIdentity] = useState<Identity | null>(authService.cachedIdentity());
  const [status, setStatus] = useState<'loading' | 'authed' | 'guest'>(
    tokenStore.access ? 'loading' : 'guest',
  );

  const applyIdentity = useCallback((next: Identity | null) => {
    setIdentity(next);
    setStatus(next ? 'authed' : 'guest');
    if (next) connectSocket(next.cafe?.id);
    else disconnectSocket();
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    applyIdentity(null);
  }, [applyIdentity]);

  useEffect(() => {
    setSessionLostHandler(() => {
      clearSession();
      toast.error('Your session ended. Please sign in again.');
    });
  }, [clearSession]);

  // hydrate on load
  useEffect(() => {
    let cancelled = false;
    if (!tokenStore.access) {
      setStatus('guest');
      return;
    }
    authService
      .me()
      .then((fresh) => {
        if (!cancelled) applyIdentity(withGuest(fresh));
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [applyIdentity, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const next = await authService.login(email, password);
        applyIdentity(next);
        toast.success(`Welcome back, ${next.user.name.split(' ')[0]}!`);
        return next;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Login failed');
        return null;
      }
    },
    [applyIdentity],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const next = await authService.register(payload);
        applyIdentity(next);
        toast.success(
          payload.role === 'owner'
            ? 'Cafe submitted for review — you can set up your menu now.'
            : 'Account created!',
        );
        return next;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Sign up failed');
        return null;
      }
    },
    [applyIdentity],
  );

  const beginGuestSession = useCallback(
    async (session: QrSession) => {
      tokenStore.set(session.token, null);
      const ctx: GuestContext = {
        cafeId: session.cafe.id,
        cafeSlug: session.cafe.slug,
        cafeName: session.cafe.name,
        tableId: session.table.id,
        tableLabel: session.table.label,
      };
      try {
        sessionStorage.setItem('fpc.guest', JSON.stringify(ctx));
      } catch {
        /* ignore */
      }
      try {
        const fresh = await authService.me();
        const next = { ...fresh, guest: ctx };
        applyIdentity(next);
        return next;
      } catch {
        clearSession();
        return null;
      }
    },
    [applyIdentity, clearSession],
  );

  const logout = useCallback(async () => {
    const wasGuest = Boolean(readGuestCtx());
    await authService.logout();
    applyIdentity(null);
    toast.success(wasGuest ? 'Thanks for dining with us!' : 'Signed out');
  }, [applyIdentity]);

  const refreshIdentity = useCallback(async () => {
    try {
      const fresh = await authService.me();
      applyIdentity(fresh);
    } catch {
      /* ignore */
    }
  }, [applyIdentity]);

  const updateProfile = useCallback(
    async (patch: { name?: string; phone?: string | null; avatarUrl?: string | null }) => {
      try {
        const next = await authService.updateProfile(patch);
        setIdentity(next);
        toast.success('Profile updated');
        return true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed');
        return false;
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      identity,
      user: identity?.user ?? null,
      cafe: identity?.cafe ?? null,
      role: identity?.user.role ?? null,
      isGuest: Boolean(identity?.guest),
      guestContext: identity?.guest ?? null,
      status,
      login,
      register,
      beginGuestSession,
      logout,
      refreshIdentity,
      updateProfile,
    }),
    [identity, status, login, register, beginGuestSession, logout, refreshIdentity, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
