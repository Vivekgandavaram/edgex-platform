import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { endpoints } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { RowSkeleton } from '../components/ui/LoadingSkeleton';
import Pagination from '../components/ui/Pagination';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: 'loading', logs: [], total: 0, error: null });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const res = await endpoints.listAuditLogs({ page, limit: 20 });
      setState({ status: 'ready', logs: res.data.logs, total: res.data.total, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted">A complete, tamper-evident trail of security-relevant events.</p>
      </div>

      {state.status === 'error' && <ErrorState description={state.error} onRetry={load} />}
      {state.status === 'loading' && <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</div>}

      {state.status === 'ready' && state.logs.length === 0 && (
        <EmptyState icon={ScrollText} title="No audit events yet" description="Security-relevant actions across EdgeX will appear here as they happen." />
      )}

      {state.status === 'ready' && state.logs.length > 0 && (
        <GlassPanel className="p-0 overflow-hidden">
          <div className="flex flex-col divide-y divide-border/50">
            {state.logs.map((l) => (
              <div key={l._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm text-ink">{l.actorName || 'System'}</span>
                  <span className="ml-2 text-sm text-muted">{l.action.replace(/_/g, ' ').replace('.', ' → ')}</span>
                  {l.resourceId && <span className="ml-2 font-tabular text-xs text-muted">{l.resourceId}</span>}
                </div>
                <span className="font-tabular text-xs text-muted">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4"><Pagination page={page} total={state.total} limit={20} onChange={setPage} /></div>
        </GlassPanel>
      )}
    </div>
  );
}
