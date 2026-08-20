import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';

// Derives locations from real devices rather than a separate hard-coded list.
export default function Locations() {
  const [state, setState] = useState({ status: 'loading', groups: [], error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await endpoints.listDevices({ limit: 200 });
      const byLocation = {};
      res.data.devices.forEach((d) => {
        const key = d.location || 'Unassigned';
        byLocation[key] = byLocation[key] || [];
        byLocation[key].push(d);
      });
      setState({ status: 'ready', groups: Object.entries(byLocation), error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Locations</h1>
        <p className="mt-1 text-sm text-muted">Devices grouped by their assigned location.</p>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.groups.length === 0 && (
        <EmptyState icon={MapPin} title="No devices connected yet" description="Locations are derived from your devices — add a device with a location to see it here." />
      )}

      {state.status === 'ready' && state.groups.map(([location, devices]) => (
        <GlassPanel key={location} className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan" />
            <h2 className="text-sm font-semibold text-ink">{location}</h2>
            <span className="text-xs text-muted">({devices.length} device{devices.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {devices.map((d) => (
              <div key={d._id} className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-3 py-1.5 text-xs text-ink">
                {d.name} <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
