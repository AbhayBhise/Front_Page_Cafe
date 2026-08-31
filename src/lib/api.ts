import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const tokenStore = {
  get access() {
    return localStorage.getItem('fpc.access');
  },
  get refresh() {
    return localStorage.getItem('fpc.refresh');
  },
  set(access: string | null, refresh?: string | null) {
    if (access) localStorage.setItem('fpc.access', access);
    else localStorage.removeItem('fpc.access');
    if (refresh !== undefined) {
      if (refresh) localStorage.setItem('fpc.refresh', refresh);
      else localStorage.removeItem('fpc.refresh');
    }
  },
  clear() {
    localStorage.removeItem('fpc.access');
    localStorage.removeItem('fpc.refresh');
    localStorage.removeItem('fpc.identity');
    try {
      sessionStorage.removeItem('fpc.guest');
    } catch {
      /* ignore */
    }
  },
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;
let onSessionLost: (() => void) | null = null;
export const setSessionLostHandler = (fn: () => void) => {
  onSessionLost = fn;
};

async function runRefresh(): Promise<string | null> {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
    const { accessToken, refreshToken, user, cafe, staff } = res.data.data;
    tokenStore.set(accessToken, refreshToken);
    localStorage.setItem('fpc.identity', JSON.stringify({ user, cafe, staff }));
    return accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res.data,
  async (error: AxiosError<{ error?: { message?: string; code?: string; details?: unknown } }>) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retried && tokenStore.refresh) {
      original._retried = true;
      refreshing = refreshing ?? runRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      }
      onSessionLost?.();
    }

    const payload = error.response?.data as { error?: { message?: string; details?: unknown } } | undefined;
    const message = payload?.error?.message || error.message || 'Request failed';
    return Promise.reject(Object.assign(new Error(message), { details: payload?.error?.details, status }));
  },
);

/** Helper: unwrap `{ data }` envelope for simple GETs. */
export async function getData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = (await api.get(url, config)) as unknown as { data: T };
  return res.data;
}
