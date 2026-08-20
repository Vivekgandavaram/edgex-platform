import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';

// Sensors are configured per-device (Devices → device → Telemetry), so this
// page aggregates across all accessible devices for a global view.
export default function Sensors() {
  const [state, setState] = useState({ status: 'loading', rows: [], error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const devicesRes = await endpoints.listDevices({ limit: 100 });
      const devices = devicesRes.data.devices;
      const sensorLists = await Promise.all(devices.map((d) => endpoints.listSensors(d.deviceId).then((r) => r.data.sensors.map((s) => ({ ...s, device: d })))));
      setState({ status: 'ready', rows: sensorLists.flat(), error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sensors</h1>
        <p className="mt-1 text-sm text-muted">Every metric your devices report, auto-discovered on first reading.</p>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.rows.length === 0 && (
        <EmptyState icon={Radio} title="No sensors configured yet" description="Sensors appear automatically once a device sends its first reading to the WRITE API." />
      )}

      {state.status === 'ready' && state.rows.length > 0 && (
        <GlassPanel className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Metric</th>
                <th className="px-5 py-3 font-medium">Device</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {state.rows.map((s) => (
                <tr key={s._id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-ink">{s.name}</td>
                  <td className="px-5 py-3.5"><Link to={`/devices/${s.device.deviceId}`} className="text-cyan hover:underline">{s.device.name}</Link></td>
                  <td className="px-5 py-3.5 text-muted">{s.type}</td>
                  <td className="px-5 py-3.5 text-muted">{s.unit || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}
