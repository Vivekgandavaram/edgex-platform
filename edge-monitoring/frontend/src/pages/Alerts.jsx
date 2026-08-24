import { useEffect, useState } from 'react';
import { BellRing, Plus } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';
import Pagination from '../components/ui/Pagination';

const FILTERS = ['All', 'Critical', 'Warning', 'Resolved'];

export default function Alerts() {
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: 'loading', alerts: [], total: 0, error: null });
  const [rules, setRules] = useState([]);
  const [ruleOpen, setRuleOpen] = useState(false);

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = { page, limit: 10 };
      if (filter === 'Critical') params.severity = 'CRITICAL';
      if (filter === 'Warning') params.severity = 'WARNING';
      if (filter === 'Resolved') params.status = 'RESOLVED';
      const res = await endpoints.listAlerts(params);
      setState({ status: 'ready', alerts: res.data.alerts, total: res.data.total, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, [filter, page]); // eslint-disable-line
  useEffect(() => { endpoints.listAlertRules().then((res) => setRules(res.data.rules)).catch(() => {}); }, []);

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
          <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`rounded-md px-3 py-1.5 text-xs ${filter === f ? 'bg-white/[0.08] text-ink' : 'text-muted hover:text-ink'}`}>{f}</button>
        ))}
        <Button variant="ghost" className="ml-2 !py-1.5 !px-3 text-xs" onClick={() => setRuleOpen(true)}><Plus className="h-3.5 w-3.5" /> New rule</Button>
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
          <Pagination page={page} total={state.total} limit={10} onChange={setPage} />
        </div>
      )}
      <GlassPanel className="p-5"><h2 className="text-sm font-semibold text-ink">Alert rules</h2><p className="mt-1 text-xs text-muted">{rules.length} threshold rules configured.</p></GlassPanel>
      {ruleOpen && <RuleModal onClose={() => setRuleOpen(false)} onCreated={() => { setRuleOpen(false); endpoints.listAlertRules().then((res) => setRules(res.data.rules)); }} />}
    </div>
  );
}

function RuleModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', deviceId: '', metric: '', operator: '>', threshold: '', severity: 'WARNING' });
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { endpoints.listDevices({ limit: 100 }).then((res) => setDevices(res.data.devices)).catch((err) => setError(err.message)); }, []);
  const submit = async (event) => { event.preventDefault(); try { await endpoints.createAlertRule({ ...form, threshold: Number(form.threshold) }); onCreated(); } catch (err) { setError(err.message); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}><GlassPanel strong className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}><h2 className="text-lg font-semibold text-ink">New alert rule</h2><form onSubmit={submit} className="mt-4 flex flex-col gap-3"><Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><label className="text-xs text-muted">Device<select required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-white/[0.04] p-2.5 text-sm text-ink"><option value="">Select device</option>{devices.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></label><Input label="Metric" required value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Input label="Operator" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} /><Input label="Threshold" type="number" required value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} /></div>{error && <p className="text-xs text-crimson">{error}</p>}<div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={onClose}>Cancel</Button><Button type="submit">Create rule</Button></div></form></GlassPanel></div>;
}
