import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Cpu, Copy, Check } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';

export default function Devices() {
  const [state, setState] = useState({ status: 'loading', devices: [], error: null });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await endpoints.listDevices({ search: search || undefined, limit: 50 });
      setState({ status: 'ready', devices: res.data.devices, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [search]); // eslint-disable-line

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Devices</h1>
          <p className="mt-1 text-sm text-muted">Controllers and gateways reporting into your edge network.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add Device</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search devices…"
          className="w-full rounded-xl border border-border bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-cyan/50 focus:outline-none"
        />
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}

      {state.status === 'loading' && (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</div>
      )}

      {state.status === 'ready' && state.devices.length === 0 && (
        <EmptyState
          icon={Cpu}
          title="No devices connected yet"
          description="Connect your first controller to begin receiving telemetry."
          action={<Button onClick={() => setModalOpen(true)}>Add Device</Button>}
        />
      )}

      {state.status === 'ready' && state.devices.length > 0 && (
        <GlassPanel className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Device</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {state.devices.map((d) => (
                <tr key={d._id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <Link to={`/devices/${d.deviceId}`} className="font-medium text-ink hover:text-cyan">{d.name}</Link>
                    <div className="font-tabular text-xs text-muted">{d.deviceId}</div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{d.location || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3.5 font-tabular text-xs text-muted">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {modalOpen && <AddDeviceModal onClose={() => setModalOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddDeviceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', controllerType: 'esp32', location: '', description: '' });
  const [result, setResult] = useState(null);
  const [state, setState] = useState({ status: 'idle', error: null });
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      const res = await endpoints.createDevice(form);
      setResult(res.data);
      onCreated();
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(result.apiKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <GlassPanel strong className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {!result ? (
          <>
            <h2 className="text-lg font-semibold text-ink">Add Device</h2>
            <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
              <Input label="Device Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">Controller Type</span>
                <select
                  value={form.controllerType}
                  onChange={(e) => setForm({ ...form, controllerType: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink focus:border-cyan/50 focus:outline-none"
                >
                  <option value="esp32">ESP32</option>
                  <option value="raspberry-pi">Raspberry Pi</option>
                  <option value="arduino">Arduino Gateway</option>
                  <option value="plc-gateway">PLC Gateway</option>
                  <option value="generic">Generic / Custom</option>
                </select>
              </label>
              <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Creating…' : 'Generate API Key'}</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-ink">Device created</h2>
            <p className="mt-1 text-sm text-muted">{result.device.deviceId} · WRITE API key generated</p>
            <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 p-3 text-xs text-amber">
              This key will only be shown once. Store it securely.
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-white/[0.04] px-3.5 py-3 font-tabular text-sm text-ink">
              <span className="flex-1 truncate">{result.apiKey.rawKey}</span>
              <button onClick={copyKey} className="text-muted hover:text-ink">{copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}</button>
            </div>
            <Button className="mt-5 w-full" onClick={onClose}>Done</Button>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
