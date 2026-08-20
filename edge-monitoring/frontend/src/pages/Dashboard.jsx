import { useEffect, useState } from 'react';
import { Cpu, Radio, Database, BellRing, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { endpoints } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import MetricCard from '../components/ui/MetricCard';
import GlassPanel from '../components/ui/GlassPanel';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import NetworkTopology from '../components/domain/NetworkTopology';

const HOUR = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', devices: [], alerts: [], error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const [devicesRes, alertsRes] = await Promise.all([
        endpoints.listDevices({ limit: 100 }),
        endpoints.listAlerts({ status: 'ACTIVE', limit: 100 }),
      ]);
      setState({
        status: 'ready',
        devices: devicesRes.data.devices,
        alerts: alertsRes.data.alerts,
        error: null,
      });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, []);

  const online = state.devices.filter((d) => d.status === 'ONLINE').length;
  const offline = state.devices.length - online;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{HOUR()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-muted">Here's what's happening across your edge network.</p>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}

      {state.status !== 'error' && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {state.status === 'loading' ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard label="Total Devices" value={state.devices.length} icon={Cpu} glow="bg-electric" empty={state.devices.length === 0} emptyText="No devices connected yet" />
              <MetricCard label="Online Devices" value={online} icon={Radio} glow="bg-emerald" empty={state.devices.length === 0} emptyText="—" />
              <MetricCard label="Offline Devices" value={offline} icon={Radio} glow="bg-muted" empty={state.devices.length === 0} emptyText="—" />
              <MetricCard label="Active Alerts" value={state.alerts.length} icon={BellRing} glow={state.alerts.length ? 'bg-crimson' : 'bg-emerald'} empty={false} />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassPanel className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Network Topology</h2>
            <Link to="/devices"><Button variant="ghost" className="!py-1.5 !px-3 text-xs"><Plus className="h-3.5 w-3.5" /> Add Device</Button></Link>
          </div>
          {state.status === 'loading' ? (
            <div className="h-72 rounded-xl shimmer" />
          ) : state.devices.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No devices connected"
              description="Connect your first controller to begin receiving telemetry."
              action={<Link to="/devices"><Button>Add Device</Button></Link>}
            />
          ) : (
            <NetworkTopology devices={state.devices} />
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Active Alerts</h2>
          {state.status === 'loading' ? (
            <div className="h-72 rounded-xl shimmer" />
          ) : state.alerts.length === 0 ? (
            <EmptyState title="ALL CLEAR" description="No active alerts." />
          ) : (
            <div className="flex flex-col gap-2">
              {state.alerts.slice(0, 6).map((a) => (
                <div key={a._id} className="rounded-xl border border-crimson/20 bg-crimson/5 px-3 py-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{a.deviceId?.name || a.deviceId?.deviceId || 'Device'}</span>
                    <span className="text-crimson">{a.severity}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{a.metric} = {a.value} (threshold {a.threshold})</p>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
