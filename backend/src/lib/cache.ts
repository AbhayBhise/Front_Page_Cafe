/**
 * High-Performance In-Memory Response Cache with TTL and Key Invalidation.
 * Designed for millions of read-heavy requests (menu lookups, cafe directory).
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Retrieve a value from cache or execute fetcher and store result.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.store.get(key);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return existing.value as T;
    }

    const value = await fetcher();
    this.set(key, value, ttlSeconds);
    return value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });

    const prevTimer = this.timers.get(key);
    if (prevTimer) clearTimeout(prevTimer);

    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttlSeconds * 1000);

    // Don't prevent Node process from exiting
    if (timer.unref) timer.unref();
    this.timers.set(key, timer);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.delete(key);
      return null;
    }
    return entry.value as T;
  }

  delete(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix or pattern (e.g. `menu:cafe-123*`).
   */
  invalidatePattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.store.clear();
  }
}

export const cache = new CacheService();
export default cache;

