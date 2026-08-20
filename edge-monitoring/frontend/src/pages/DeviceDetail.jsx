import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Radio } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { ChartSkeleton } from '../components/ui/LoadingSkeleton';
import TelemetryPanel from '../components/domain/TelemetryPanel';

const TABS = ['Overview', 'Telemetry', 'Analytics', 'Alerts', 'API', 'Audit'];

export default function DeviceDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('Overview');
  const [state, setState] = useState({ status: 'loading', device: null, sensors: [], error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const [deviceRes, sensorsRes] = await Promise.all([
        endpoints.getDevice(id),
        endpoints.listSensors(id),
      ]);
      setState({ status: 'ready', device: deviceRes.data.device, sensors: sensorsRes.data.sensors, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (state.status === 'loading') return <ChartSkeleton />;
  if (state.status === 'error') return <ErrorState description={state.error} onRetry={load} />;

  const { device, sensors } = state;

  return (
    <div className="flex flex-col gap-6">
      <Link to="/devices" className="flex w-fit items-center gap-1.5 text-xs text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Devices
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{device.name}</h1>
            <StatusBadge status={device.status} />
          </div>
          <p className="mt-1 font-tabular text-sm text-muted">{device.deviceId} · {device.location || 'No location set'} · Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm transition-colors ${tab === t ? 'border-b-2 border-cyan text-ink' : 'text-muted hover:text-ink'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <GlassPanel className="p-5"><p className="text-xs text-muted uppercase tracking-wide">Controller Type</p><p className="mt-2 text-lg text-ink">{device.controllerType}</p></GlassPanel>
          <GlassPanel className="p-5"><p className="text-xs text-muted uppercase tracking-wide">Firmware</p><p className="mt-2 text-lg text-ink">{device.firmwareVersion || 'Unknown'}</p></GlassPanel>
          <GlassPanel className="p-5"><p className="text-xs text-muted uppercase tracking-wide">Sensors Reporting</p><p className="mt-2 text-lg text-ink">{sensors.length}</p></GlassPanel>
        </div>
      )}

      {tab === 'Telemetry' && (
        sensors.length === 0 ? (
          <EmptyState icon={Radio} title="This device has not reported sensor data yet." description="Once the controller starts sending data to the WRITE API, metrics will appear here automatically." />
        ) : (
          <TelemetryPanel deviceId={id} sensors={sensors} />
        )
      )}

      {tab === 'Analytics' && <EmptyState title="No telemetry available for this period." description="Select a device and time range in Analytics to view historical charts." />}
      {tab === 'Alerts' && <EmptyState title="No active alerts" description="Everything is clear for this device." />}
      {tab === 'API' && <EmptyState title="View this device's keys in API Management" description="API keys are managed centrally in the API Management section." />}
      {tab === 'Audit' && <EmptyState title="No audit events for this device yet." />}
    </div>
  );
}
