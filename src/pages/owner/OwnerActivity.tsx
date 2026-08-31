import { useCallback, useEffect, useState } from 'react';
import { useOwnerCafe } from '../../hooks/useOwnerCafe';
import { cafeService, type ActivityLog } from '../../services/cafeService';
import { PageState } from '../../components/ui';
import ActivityFeed from '../../components/ActivityFeed';

const OwnerActivity = () => {
  const { cafeId } = useOwnerCafe();
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!cafeId) return;
    setLoading(true);
    setError(null);
    cafeService
      .activity(cafeId, page)
      .then((res) => {
        setItems(res.data);
        setPages(res.meta.pages);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load activity'))
      .finally(() => setLoading(false));
  }, [cafeId, page]);

  useEffect(load, [load]);

  return (
    <div className="container py-4" style={{ minHeight: '70vh', maxWidth: 760 }}>
      <h2 className="fw-bold mb-3">Activity log</h2>
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body">
          <PageState loading={loading} error={error} onRetry={load}>
            <ActivityFeed items={items} />
            {pages > 1 && (
              <div className="d-flex justify-content-between align-items-center pt-3">
                <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span className="small text-muted">
                  Page {page} of {pages}
                </span>
                <button className="btn btn-sm btn-outline-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </PageState>
        </div>
      </div>
    </div>
  );
};

export default OwnerActivity;
