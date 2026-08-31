import { useCallback, useEffect, useState } from 'react';
import { cafeService } from '../services/cafeService';
import type { Cafe, Counter } from '../types';

/** Resolves the cafe the current owner/admin is managing. */
export function useOwnerCafe() {
  const [cafe, setCafe] = useState<(Cafe & { counters?: Counter[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    cafeService
      .mine()
      .then(setCafe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load your cafe'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  return { cafe, cafeId: cafe?.id ?? null, loading, error, reload, setCafe };
}
