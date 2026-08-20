import GlassPanel from './GlassPanel';
import clsx from 'clsx';

// Dashboard/overview metric tile. Value must be passed in — never hard-code
// business numbers here. Pass `loading` while fetching and `empty` when the
// backend has confirmed there is nothing to show yet.
export default function MetricCard({ label, value, unit, delta, icon: Icon, glow = 'bg-electric', loading, empty, emptyText = 'No data yet' }) {
  return (
    <GlassPanel glow={glow} className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted" strokeWidth={1.75} />}
      </div>

      {loading ? (
        <div className="mt-4 h-8 w-24 rounded-md shimmer" />
      ) : empty ? (
        <p className="mt-4 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-tabular text-3xl font-semibold text-ink">{value}</span>
          {unit && <span className="text-sm text-muted">{unit}</span>}
        </div>
      )}

      {!loading && !empty && delta !== undefined && delta !== null && (
        <div className={clsx('mt-2 text-xs font-medium', delta >= 0 ? 'text-emerald' : 'text-crimson')}>
          {delta >= 0 ? '+' : ''}{delta}% vs previous period
        </div>
      )}
    </GlassPanel>
  );
}
