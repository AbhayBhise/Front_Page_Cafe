export const money = (n: number | undefined | null, currency = 'INR') => {
  const value = Number(n ?? 0);
  const symbol = currency === 'INR' ? '₹' : currency + ' ';
  return `${symbol} ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const dateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const dateShort = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

export const timeAgo = (iso?: string | null) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const ORDER_STATUS_META: Record<
  string,
  { label: string; bg: string; text?: string; icon: string }
> = {
  pending: { label: 'Pending', bg: 'bg-warning', text: 'text-dark', icon: 'hourglass-split' },
  accepted: { label: 'Accepted', bg: 'bg-info', text: 'text-dark', icon: 'check2-circle' },
  preparing: { label: 'Preparing', bg: 'bg-primary', icon: 'fire' },
  ready: { label: 'Ready', bg: 'bg-success', icon: 'bag-check' },
  completed: { label: 'Completed', bg: 'bg-secondary', icon: 'check-all' },
  cancelled: { label: 'Cancelled', bg: 'bg-danger', icon: 'x-circle' },
  rejected: { label: 'Rejected', bg: 'bg-danger', icon: 'x-octagon' },
};

export const CAFE_STATUS_META: Record<string, { label: string; bg: string; text?: string }> = {
  pending: { label: 'Pending review', bg: 'bg-warning', text: 'text-dark' },
  approved: { label: 'Approved', bg: 'bg-success' },
  rejected: { label: 'Rejected', bg: 'bg-danger' },
  suspended: { label: 'Suspended', bg: 'bg-dark' },
};
