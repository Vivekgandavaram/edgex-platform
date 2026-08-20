import clsx from 'clsx';

const MAP = {
  ONLINE: { label: 'Online', dot: 'bg-emerald', text: 'text-emerald' },
  ACTIVE: { label: 'Active', dot: 'bg-emerald', text: 'text-emerald' },
  WARNING: { label: 'Warning', dot: 'bg-amber', text: 'text-amber' },
  CRITICAL: { label: 'Critical', dot: 'bg-crimson', text: 'text-crimson' },
  OFFLINE: { label: 'Offline', dot: 'bg-muted', text: 'text-muted' },
  REVOKED: { label: 'Revoked', dot: 'bg-crimson', text: 'text-crimson' },
  DISABLED: { label: 'Disabled', dot: 'bg-muted', text: 'text-muted' },
  PENDING: { label: 'Pending', dot: 'bg-amber', text: 'text-amber' },
  RESOLVED: { label: 'Resolved', dot: 'bg-emerald', text: 'text-emerald' },
  ACKNOWLEDGED: { label: 'Acknowledged', dot: 'bg-cyan', text: 'text-cyan' },
  INFO: { label: 'Info', dot: 'bg-cyan', text: 'text-cyan' },
};

export default function StatusBadge({ status, label }) {
  const cfg = MAP[status] || { label: status, dot: 'bg-muted', text: 'text-muted' };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide">
      <span className={clsx('h-1.5 w-1.5 rounded-full', cfg.dot)} aria-hidden />
      <span className={cfg.text}>{label || cfg.label}</span>
    </span>
  );
}
