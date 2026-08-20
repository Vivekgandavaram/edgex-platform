import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { endpoints } from '../lib/api';
import { getSocket } from '../lib/socket';
import GlassPanel from '../components/ui/GlassPanel';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';

export default function Live() {
  const [state, setState] = useState({ status: 'loading', devices: [], error: null });
  const [liveValues, setLiveValues] = useState({}); // deviceId -> { metric: value }

  const load = async () => {
    try {
      const res = await endpoints.listDevices({ limit: 100 });
      setState({ status: 'ready', devices: res.data.devices, error: null });
    } catch (err) {
      setState({ status: 'error', devices: [], error: err.message });
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    state.devices.forEach((d) => socket.emit('subscribe:device', d._id));
    const handler = ({ deviceId, data }) => {
      setLiveValues((prev) => ({ ...prev, [deviceId]: { ...prev[deviceId], ...data } }));
    };
    socket.on('reading', handler);
    return () => socket.off('reading', handler);
  }, [state.devices]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Live Monitoring</h1>
        <p className="mt-1 text-sm text-muted">Real-time telemetry as it arrives from your controllers. No polling, no simulated updates.</p>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.devices.length === 0 && (
        <EmptyState icon={Radio} title="No devices connected yet" description="Connect a controller to see live values stream in here." />
      )}

      {state.status === 'ready' && state.devices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.devices.map((d) => (
            <GlassPanel key={d._id} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{d.name}</span>
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {Object.keys(liveValues[d._id] || {}).length === 0 ? (
                  <p className="text-xs text-muted">Waiting for live data…</p>
                ) : (
                  Object.entries(liveValues[d._id]).map(([metric, value]) => (
                    <div key={metric} className="flex justify-between text-xs">
                      <span className="text-muted">{metric}</span>
                      <span className="font-tabular text-ink">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
