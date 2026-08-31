import React from 'react';
import { ORDER_STATUS_META, CAFE_STATUS_META } from '../lib/format';

export const Spinner: React.FC<{ label?: string; className?: string }> = ({ label = 'Loading…', className }) => (
  <div className={`text-center py-5 ${className ?? ''}`}>
    <div className="spinner-border text-secondary" role="status">
      <span className="visually-hidden">{label}</span>
    </div>
    <p className="text-muted mt-2 mb-0 small">{label}</p>
  </div>
);

interface PageStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyHint?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const PageState: React.FC<PageStateProps> = ({
  loading,
  error,
  empty,
  emptyIcon = 'inbox',
  emptyTitle = 'Nothing here yet',
  emptyHint,
  onRetry,
  children,
}) => {
  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-triangle display-5 text-warning d-block mb-3" />
        <p className="text-muted">{error}</p>
        {onRetry && (
          <button className="btn btn-outline-secondary btn-sm" onClick={onRetry}>
            <i className="bi bi-arrow-clockwise me-1" /> Retry
          </button>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="text-center py-5">
        <i className={`bi bi-${emptyIcon} display-4 text-muted opacity-25 d-block mb-3`} />
        <h5 className="text-muted">{emptyTitle}</h5>
        {emptyHint && <div className="text-muted small">{emptyHint}</div>}
      </div>
    );
  return <>{children}</>;
};

export const OrderStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const meta = ORDER_STATUS_META[status] ?? { label: status, bg: 'bg-secondary', icon: 'dot', text: '' };
  return (
    <span className={`badge rounded-pill ${meta.bg} ${meta.text ?? ''} ${className ?? ''}`}>
      <i className={`bi bi-${meta.icon} me-1`} />
      {meta.label}
    </span>
  );
};

export const CafeStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = CAFE_STATUS_META[status] ?? { label: status, bg: 'bg-secondary', text: '' };
  return <span className={`badge rounded-pill ${meta.bg} ${meta.text ?? ''}`}>{meta.label}</span>;
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: string;
  hint?: React.ReactNode;
  tone?: string;
}> = ({ label, value, icon, hint, tone }) => (
  <div className={`card border-0 shadow-sm rounded-4 p-3 h-100 ${tone ?? ''}`}>
    <div className="d-flex align-items-center justify-content-between">
      <h6 className={`mb-1 ${tone ? 'opacity-75' : 'text-muted'}`}>{label}</h6>
      {icon && <i className={`bi bi-${icon} ${tone ? 'opacity-75' : 'text-secondary'}`} />}
    </div>
    <div className="fs-3 fw-bold">{value}</div>
    {hint && <div className="small mt-1">{hint}</div>}
  </div>
);

export const VegDot: React.FC<{ isVeg: boolean }> = ({ isVeg }) => (
  <span
    title={isVeg ? 'Veg' : 'Non-veg'}
    className="d-inline-flex align-items-center justify-content-center border"
    style={{ width: 16, height: 16, borderColor: isVeg ? '#198754' : '#b02a37' }}
  >
    <span
      className="rounded-circle"
      style={{ width: 8, height: 8, background: isVeg ? '#198754' : '#b02a37' }}
    />
  </span>
);
