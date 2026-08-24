import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Radio, Activity, BellRing, KeyRound, ScrollText } from 'lucide-react';
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
  const [panel, setPanel] = useState({ status: 'idle', readings: [], alerts: [], logs: [], error: null });

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
  useEffect(() => {
    if (!state.device || tab === 'Overview' || tab === 'Telemetry') return;
    const loadPanel = async () => {
      setPanel((current) => ({ ...current, status: 'loading', error: null }));
      try {
        if (tab === 'Analytics') {
          const res = await endpoints.read({ deviceId: state.device.deviceId, from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), limit: 100 });
          setPanel({ status: 'ready', readings: res.data.readings, alerts: [], logs: [], error: null });
        } else if (tab === 'Alerts') {
          const res = await endpoints.listAlerts({ deviceId: state.device._id, limit: 25 });
          setPanel({ status: 'ready', readings: [], alerts: res.data.alerts, logs: [], error: null });
        } else if (tab === 'Audit') {
          const res = await endpoints.listAuditLogs({ limit: 25, resourceId: state.device.deviceId });
          setPanel({ status: 'ready', readings: [], alerts: [], logs: res.data.logs, error: null });
        } else setPanel({ status: 'ready', readings: [], alerts: [], logs: [], error: null });
      } catch (err) { setPanel((current) => ({ ...current, status: 'error', error: err.message })); }
    };
    loadPanel();
  }, [tab, state.device]);

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

      {tab === 'Analytics' && <DataPanel loading={panel.status === 'loading'} error={panel.error} icon={Activity} title="Recent telemetry" empty={!panel.readings.length} description="No readings reported in the last 24 hours." items={panel.readings.map((reading) => `${reading.metric}: ${reading.value ?? JSON.stringify(reading.values)} · ${new Date(reading.timestamp).toLocaleString()}`)} />}
      {tab === 'Alerts' && <DataPanel loading={panel.status === 'loading'} error={panel.error} icon={BellRing} title="Device alerts" empty={!panel.alerts.length} description="No alerts have been recorded for this device." items={panel.alerts.map((alert) => `${alert.metric} = ${alert.value} · ${alert.status} · ${new Date(alert.createdAt).toLocaleString()}`)} />}
      {tab === 'API' && <DataPanel icon={KeyRound} title="Device API access" empty={false} description="Manage this device's keys in API Management." items={[`Device identifier: ${device.deviceId}`, 'WRITE keys are created during device onboarding.']} />}
      {tab === 'Audit' && <DataPanel loading={panel.status === 'loading'} error={panel.error} icon={ScrollText} title="Device audit trail" empty={!panel.logs.length} description="No audit events have been recorded for this device." items={panel.logs.map((log) => `${log.actorName || 'System'} · ${log.action} · ${new Date(log.createdAt).toLocaleString()}`)} />}
    </div>
  );
}

function DataPanel({ loading, error, icon: Icon, title, empty, description, items }) {
  if (loading) return <ChartSkeleton />;
  if (error) return <ErrorState description={error} />;
  if (empty) return <EmptyState icon={Icon} title={title} description={description} />;
  return <GlassPanel className="p-5"><h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Icon className="h-4 w-4 text-cyan" />{title}</h2><div className="mt-4 flex flex-col divide-y divide-border/50">{items.map((item) => <p key={item} className="py-3 text-sm text-muted">{item}</p>)}</div></GlassPanel>;
}
