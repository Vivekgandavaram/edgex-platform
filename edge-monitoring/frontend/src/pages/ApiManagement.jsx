import { useEffect, useState } from 'react';
import { KeyRound, Plus, RotateCw, Ban, Copy, Check } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';

export default function ApiManagement() {
  const [state, setState] = useState({ status: 'loading', keys: [], error: null });
  const [typeFilter, setTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [reveal, setReveal] = useState(null);

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await endpoints.listApiKeys(typeFilter ? { type: typeFilter } : {});
      setState({ status: 'ready', keys: res.data.apiKeys, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, [typeFilter]); // eslint-disable-line

  const rotate = async (id) => { const res = await endpoints.rotateApiKey(id); setReveal(res.data.apiKey); load(); };
  const revoke = async (id) => { await endpoints.revokeApiKey(id); load(); };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">API Management</h1>
          <p className="mt-1 text-sm text-muted">Two universal endpoints. <span className="font-tabular text-cyan">POST /api/v1/write</span> · <span className="font-tabular text-violet">GET /api/v1/read</span></p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create API Key</Button>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-white/[0.02] p-1 w-fit">
        {['', 'WRITE', 'READ'].map((t) => (
          <button key={t || 'all'} onClick={() => setTypeFilter(t)} className={`rounded-md px-3 py-1.5 text-xs ${typeFilter === t ? 'bg-white/[0.08] text-ink' : 'text-muted hover:text-ink'}`}>{t || 'All'}</button>
        ))}
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.keys.length === 0 && (
        <EmptyState icon={KeyRound} title="No API access has been created yet" description="Generate a WRITE key when you add a device, or a READ key to grant a user data access." action={<Button onClick={() => setCreateOpen(true)}>Create API Key</Button>} />
      )}

      {state.status === 'ready' && state.keys.length > 0 && (
        <GlassPanel className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">API ID</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Assigned To</th>
                <th className="px-5 py-3 font-medium">Key</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Used</th>
                <th className="px-5 py-3 font-medium">Requests</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.keys.map((k) => (
                <tr key={k._id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-tabular text-ink">{k.apiId}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={k.type === 'WRITE' ? 'INFO' : 'ACTIVE'} label={k.type} /></td>
                  <td className="px-5 py-3.5 text-muted">{k.deviceId?.name || k.assignedTo?.name || '—'}</td>
                  <td className="px-5 py-3.5 font-tabular text-xs text-muted">{k.keyPreview}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={k.status} /></td>
                  <td className="px-5 py-3.5 font-tabular text-xs text-muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}</td>
                  <td className="px-5 py-3.5 font-tabular text-xs text-muted">{k.requestCount}</td>
                  <td className="px-5 py-3.5">
                    {k.status === 'ACTIVE' && (
                      <div className="flex gap-2">
                        <button onClick={() => rotate(k._id)} className="text-muted hover:text-ink" title="Rotate"><RotateCw className="h-3.5 w-3.5" /></button>
                        <button onClick={() => revoke(k._id)} className="text-muted hover:text-crimson" title="Revoke"><Ban className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {createOpen && <CreateKeyModal onClose={() => setCreateOpen(false)} onCreated={(key) => { setReveal(key); load(); }} />}
      {reveal && <RevealKeyModal apiKey={reveal} onClose={() => setReveal(null)} />}
    </div>
  );
}

function CreateKeyModal({ onClose, onCreated }) {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [step, setStep] = useState(1);
  const [type, setType] = useState('WRITE');
  const [target, setTarget] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null });

  useEffect(() => {
    endpoints.listDevices({ limit: 100 }).then((r) => setDevices(r.data.devices)).catch(() => {});
    endpoints.listUsers({ limit: 100 }).then((r) => setUsers(r.data.users)).catch(() => {});
  }, []);

  const submit = async () => {
    setState({ status: 'loading', error: null });
    try {
      const body = type === 'WRITE' ? { type, deviceId: target } : { type, assignedTo: target };
      const res = await endpoints.createApiKey(body);
      onCreated(res.data.apiKey);
      onClose();
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  const targetOptions = type === 'WRITE' ? devices : users;
  const targetLabel = type === 'WRITE' ? 'device' : 'user';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <GlassPanel strong className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-ink">Create API Key</h2>
        <div className="mt-4 flex gap-2 text-[11px] text-muted">
          {[1, 2, 3].map((s) => <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-cyan' : 'bg-white/10'}`} />)}
        </div>

        {step === 1 && (
          <div className="mt-5">
            <p className="mb-3 text-sm text-muted">Choose access type</p>
            <div className="flex gap-2">
              {['WRITE', 'READ'].map((t) => (
                <button key={t} onClick={() => { setType(t); setTarget(''); setStep(2); }} className={`flex-1 rounded-xl border px-4 py-3 text-sm ${type === t ? 'border-cyan/50 bg-cyan/10 text-ink' : 'border-border text-muted'}`}>
                  {t}
                </button>
              ))}
            </div>
            <Button className="mt-5 w-full" disabled={!type} onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5">
            <p className="mb-3 text-sm text-muted">Choose {targetLabel}</p>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-xl border border-border bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink focus:outline-none">
              <option value="">Select…</option>
              {targetOptions.map((item) => (
                <option key={item._id} value={item._id}>
                  {type === 'WRITE' ? (item.name || item.deviceId) : `${item.name} (${item.email})`}
                </option>
              ))}
            </select>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" disabled={!target} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5">
            <p className="text-sm text-muted">Generate a {type} key for the selected {targetLabel}?</p>
            {state.status === 'error' && <p className="mt-2 text-xs text-crimson">{state.error}</p>}
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" disabled={state.status === 'loading'} onClick={submit}>{state.status === 'loading' ? 'Generating…' : 'Generate'}</Button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function RevealKeyModal({ apiKey, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(apiKey.rawKey); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <GlassPanel strong className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-ink">{apiKey.apiId} created</h2>
        <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 p-3 text-xs text-amber">This key will only be shown once. Store it securely.</div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-white/[0.04] px-3.5 py-3 font-tabular text-sm text-ink">
          <span className="flex-1 truncate">{apiKey.rawKey}</span>
          <button onClick={copy} className="text-muted hover:text-ink">{copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}</button>
        </div>
        <Button className="mt-5 w-full" onClick={onClose}>Done</Button>
      </GlassPanel>
    </div>
  );
}
