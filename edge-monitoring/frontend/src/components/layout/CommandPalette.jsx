import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import GlassPanel from '../ui/GlassPanel';

const ACTIONS = [
  { label: 'Go to Dashboard', to: '/' },
  { label: 'Add Device', to: '/devices' },
  { label: 'Create API Key', to: '/api-management' },
  { label: 'Open Analytics', to: '/analytics' },
  { label: 'View Alerts', to: '/alerts' },
  { label: 'Search Audit Logs', to: '/audit-logs' },
  { label: 'Manage Users', to: '/users' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  const filtered = ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-32" onClick={onClose}>
      <GlassPanel strong className="w-full max-w-lg p-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <Search className="h-4 w-4 text-muted" strokeWidth={1.75} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search devices, sensors, alerts, settings…"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && <p className="px-3 py-4 text-sm text-muted">No matching actions.</p>}
          {filtered.map((a) => (
            <button
              key={a.label}
              onClick={() => { navigate(a.to); onClose(); }}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-white/[0.06]"
            >
              {a.label}
            </button>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
