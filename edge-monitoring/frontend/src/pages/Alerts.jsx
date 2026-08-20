import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';

const FILTERS = ['All', 'Critical', 'Warning', 'Resolved'];

export default function Alerts() {
  const [filter, setFilter] = useState('All');
  const [state, setState] = useState({ status: 'loading', alerts: [], error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = {};
      if (filter === 'Critical') params.severity = 'CRITICAL';
      if (filter === 'Warning') params.severity = 'WARNING';
      if (filter === 'Resolved') params.status = 'RESOLVED';
      const res = await endpoints.listAlerts(params);
      setState({ status: 'ready', alerts: res.data.alerts, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  const act = async (id, action) => {
    await (action === 'ack' ? endpoints.acknowledgeAlert(id) : endpoints.resolveAlert(id));
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Alert Center</h1>
        <p className="mt-1 text-sm text-muted">Threshold breaches detected across your edge network.</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-white/[0.02] p-1 w-fit">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs ${filter === f ? 'bg-white/[0.08] text-ink' : 'text-muted hover:text-ink'}`}>{f}</button>
        ))}
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.alerts.length === 0 && (
        <EmptyState icon={BellRing} title="ALL CLEAR" description="No active alerts." />
      )}

      {state.status === 'ready' && state.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {state.alerts.map((a) => (
            <GlassPanel key={a._id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{a.deviceId?.name || 'Device'}</span>
                  <StatusBadge status={a.severity} />
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 font-tabular text-xs text-muted">{a.metric} = {a.value} · threshold {a.threshold} · {new Date(a.createdAt).toLocaleString()}</p>
              </div>
              {a.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={() => act(a._id, 'ack')}>Acknowledge</Button>
                  <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={() => act(a._id, 'resolve')}>Resolve</Button>
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
