import { useEffect, useState } from 'react';
import { Users as UsersIcon, Plus } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';

export default function Users() {
  const [state, setState] = useState({ status: 'loading', users: [], error: null });
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await endpoints.listUsers({ limit: 100 });
      setState({ status: 'ready', users: res.data.users, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">People with read access to devices in your organization.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add User</Button>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.users.length === 0 && (
        <EmptyState icon={UsersIcon} title="No users have been added" action={<Button onClick={() => setModalOpen(true)}>Add User</Button>} />
      )}

      {state.status === 'ready' && state.users.length > 0 && (
        <GlassPanel className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((u) => (
                <tr key={u._id} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-ink">{u.name}</td>
                  <td className="px-5 py-3.5 text-muted">{u.email}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3.5 font-tabular text-xs text-muted">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {modalOpen && <AddUserModal onClose={() => setModalOpen(false)} onCreated={load} />}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [state, setState] = useState({ status: 'idle', error: null });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await endpoints.createUser(form);
      onCreated();
      onClose();
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <GlassPanel strong className="w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-ink">Add User</h2>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Adding…' : 'Add User'}</Button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
