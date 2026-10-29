import { useEffect, useState } from 'react';
import CafeCard from '../components/CafeCard';
import { PageState } from '../components/ui';
import { CafeCardSkeleton } from '../components/Shimmer';
import { cafeService } from '../services/cafeService';
import type { Cafe } from '../types';

const CafeList = () => {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');

  const load = (search: string) => {
    setLoading(true);
    setError(null);
    cafeService
      .discover({ q: search || undefined, pageSize: 30 })
      .then((res) => setCafes(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load cafes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load('');
  }, []);

  return (
    <div className="container py-4" style={{ minHeight: '70vh' }}>
      <h2 className="fw-bold mb-1">Find a cafe</h2>
      <p className="text-muted">Every cafe here is verified and approved by our team.</p>

      <form
        className="d-flex gap-2 mb-4"
        style={{ maxWidth: 460 }}
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q.trim());
          load(q.trim());
        }}
      >
        <input
          className="form-control"
          placeholder="Search by name or city…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <i className="bi bi-search" />
        </button>
      </form>

      <PageState
        loading={loading}
        loadingComponent={
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div className="col" key={idx}>
                <CafeCardSkeleton />
              </div>
            ))}
          </div>
        }
        error={error}
        empty={cafes.length === 0}
        emptyIcon="shop"
        emptyTitle={submitted ? `No cafes match "${submitted}"` : 'No cafes are live yet'}
        onRetry={() => load(submitted)}
      >
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {cafes.map((cafe) => (
            <div className="col" key={cafe.id}>
              <CafeCard cafe={cafe} />
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
};

export default CafeList;
