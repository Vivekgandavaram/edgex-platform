import { useEffect, useState } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';
import { useAuth } from '../lib/auth-context';

const ALL_PERMISSIONS = [
  'devices.read', 'devices.create', 'devices.update',
  'sensors.read', 'sensors.create',
  'api.read', 'api.create', 'api.revoke',
  'alerts.read', 'alerts.create',
  'analytics.read', 'users.read', 'users.create',
];

export default function Admins() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', admins: [], error: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await endpoints.listAdmins();
      setState({ status: 'ready', admins: res.data.admins, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, []);

  if (user && user.role !== 'SUPER_ADMIN') {
    return <EmptyState icon={ShieldCheck} title="Super Admin access required" description="Only the Super Admin can view and manage administrators." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Admin Management</h1>
          <p className="mt-1 text-sm text-muted">Grant scoped, permission-based access to your team.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add Admin</Button>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.admins.length === 0 && (
        <EmptyState icon={ShieldCheck} title="No administrators created" action={<Button onClick={() => setModalOpen(true)}>Add Administrator</Button>} />
      )}

      {state.status === 'ready' && state.admins.length > 0 && (
        <GlassPanel className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Permissions</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.admins.map((a) => (
                <tr key={a._id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-ink">{a.name}</td>
                  <td className="px-5 py-3.5 text-muted">{a.email}</td>
                  <td className="px-5 py-3.5 text-muted">{a.role.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5 text-muted">{a.role === 'SUPER_ADMIN' ? 'Global' : <button className="text-cyan hover:underline" onClick={() => setEditing(a)}>{a.permissions?.length || 0} granted · Edit</button>}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {modalOpen && <AddAdminModal onClose={() => setModalOpen(false)} onCreated={load} />}
      {editing && <EditAdminModal admin={editing} onClose={() => setEditing(null)} onUpdated={load} />}
    </div>
  );
}

function EditAdminModal({ admin, onClose, onUpdated }) {
  const [permissions, setPermissions] = useState(admin.permissions || []);
  const [state, setState] = useState({ loading: false, error: '' });
  const toggle = (permission) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  const submit = async (event) => { event.preventDefault(); setState({ loading: true, error: '' }); try { await endpoints.updateAdmin(admin._id, { permissions }); await onUpdated(); onClose(); } catch (err) { setState({ loading: false, error: err.message }); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}><GlassPanel strong className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}><h2 className="text-lg font-semibold text-ink">Edit permissions</h2><p className="mt-1 text-sm text-muted">{admin.name}</p><form onSubmit={submit} className="mt-4"><div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">{ALL_PERMISSIONS.map((permission) => <label key={permission} className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={permissions.includes(permission)} onChange={() => toggle(permission)} className="accent-cyan-500" />{permission}</label>)}</div>{state.error && <p className="mt-3 text-xs text-crimson">{state.error}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="ghost" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={state.loading}>{state.loading ? 'Saving…' : 'Save permissions'}</Button></div></form></GlassPanel></div>;
}

function AddAdminModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', permissions: [] });
  const [state, setState] = useState({ status: 'idle', error: null });

  const togglePerm = (p) => setForm((f) => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await endpoints.createAdmin(form);
      onCreated();
      onClose();
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <GlassPanel strong className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-ink">Add Admin</h2>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Permissions</span>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {ALL_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} className="accent-cyan-500" />
                  {p}
                </label>
              ))}
            </div>
          </div>
          {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Adding…' : 'Add Admin'}</Button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
