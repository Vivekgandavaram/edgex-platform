import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import GlassPanel from '../ui/GlassPanel';
import { ChartSkeleton } from '../ui/LoadingSkeleton';
import ErrorState from '../ui/ErrorState';
import { endpoints } from '../../lib/api';

// Fully sensor-agnostic: renders one card per metric the backend actually
// reports for this device, regardless of what that metric is named or means.
export default function TelemetryPanel({ deviceId, sensors }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sensors.filter((s) => s.enabled !== false).map((sensor) => (
        <SensorCard key={sensor._id} deviceId={deviceId} sensor={sensor} />
      ))}
    </div>
  );
}

function SensorCard({ deviceId, sensor }) {
  const [state, setState] = useState({ status: 'loading', readings: [], error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await endpoints.read({ deviceId, sensor: sensor.name, limit: 50, sort: 'asc' });
        if (!cancelled) setState({ status: 'ready', readings: res.data.readings, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', readings: [], error: err.message });
      }
    })();
    return () => { cancelled = true; };
  }, [deviceId, sensor.name]);

  if (state.status === 'loading') return <ChartSkeleton />;
  if (state.status === 'error') return <ErrorState title={`Unable to load ${sensor.name}`} description={state.error} />;

  const scalarReadings = state.readings.filter((r) => r.value !== undefined && r.value !== null);
  const values = scalarReadings.map((r) => r.value);
  const latest = values[values.length - 1];
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : null;
  const chartData = scalarReadings.map((r) => ({ t: r.timestamp, v: r.value }));

  return (
    <GlassPanel className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{sensor.name}</span>
        {sensor.unit && <span className="text-xs text-muted">{sensor.unit}</span>}
      </div>

      {values.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No telemetry available.</p>
      ) : (
        <>
          <div className="mt-2 font-tabular text-2xl font-semibold text-ink">
            {latest} <span className="text-sm font-normal text-muted">{sensor.unit}</span>
          </div>

          <div className="mt-3 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip
                  contentStyle={{ background: '#090D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                />
                <Line type="monotone" dataKey="v" stroke="#22D3EE" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 font-tabular text-[11px] text-muted">
            <div>Min<div className="text-ink">{min}</div></div>
            <div>Avg<div className="text-ink">{avg}</div></div>
            <div>Max<div className="text-ink">{max}</div></div>
          </div>
        </>
      )}
    </GlassPanel>
  );
}
