import { useEffect, useState } from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { ChartSkeleton } from '../components/ui/LoadingSkeleton';

const RANGES = [
  { label: '10 MIN', ms: 10 * 60 * 1000 },
  { label: '1 HOUR', ms: 60 * 60 * 1000 },
  { label: 'TODAY', ms: 24 * 60 * 60 * 1000 },
  { label: '7 DAYS', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 DAYS', ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function Analytics() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [sensors, setSensors] = useState([]);
  const [metric, setMetric] = useState('');
  const [range, setRange] = useState(RANGES[2]);
  const [state, setState] = useState({ status: 'idle', readings: [], error: null });

  useEffect(() => {
    endpoints.listDevices({ limit: 100 }).then((res) => setDevices(res.data.devices)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!deviceId) { setSensors([]); setMetric(''); return; }
    endpoints.listSensors(deviceId).then((res) => { setSensors(res.data.sensors); setMetric(res.data.sensors[0]?.name || ''); }).catch(() => {});
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId || !metric) { setState({ status: 'idle', readings: [], error: null }); return; }
    setState((s) => ({ ...s, status: 'loading', error: null }));
    endpoints.read({ deviceId, sensor: metric, from: new Date(Date.now() - range.ms).toISOString(), limit: 1000, sort: 'asc' })
      .then((res) => setState({ status: 'ready', readings: res.data.readings, error: null }))
      .catch((err) => setState({ status: 'error', readings: [], error: err.message }));
  }, [deviceId, metric, range]);

  const chartData = state.readings.filter((r) => r.value !== undefined && r.value !== null).map((r) => ({ t: new Date(r.timestamp).toLocaleTimeString(), v: r.value }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Explore historical telemetry across any device and metric.</p>
      </div>

      <GlassPanel className="flex flex-wrap items-center gap-3 p-4">
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} className="rounded-lg border border-border bg-white/[0.04] px-3 py-2 text-sm text-ink focus:outline-none">
          <option value="">Select device…</option>
          {devices.map((d) => <option key={d._id} value={d.deviceId}>{d.name}</option>)}
        </select>
        <select value={metric} onChange={(e) => setMetric(e.target.value)} disabled={!sensors.length} className="rounded-lg border border-border bg-white/[0.04] px-3 py-2 text-sm text-ink focus:outline-none disabled:opacity-40">
          <option value="">Metric…</option>
          {sensors.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <div className="flex gap-1 rounded-lg border border-border bg-white/[0.02] p-1">
          {RANGES.map((r) => (
            <button key={r.label} onClick={() => setRange(r)} className={`rounded-md px-2.5 py-1.5 text-xs ${range.label === r.label ? 'bg-white/[0.08] text-ink' : 'text-muted hover:text-ink'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </GlassPanel>

      {!deviceId && <EmptyState icon={LineChartIcon} title="Select a device to begin" description="Choose a device and metric above to view historical analytics." />}

      {deviceId && state.status === 'loading' && <ChartSkeleton />}
      {deviceId && state.status === 'error' && <ErrorState description={state.error} />}
      {deviceId && state.status === 'ready' && chartData.length === 0 && (
        <EmptyState title="No telemetry available for this period." description="Try a wider time range or a different metric." />
      )}
      {deviceId && state.status === 'ready' && chartData.length > 0 && (
        <GlassPanel className="p-5">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#929AAA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
