import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function TopBar({ onOpenCommandPalette }) {
  const { user, logout } = useAuth();

  const greetingName = user?.name?.split(' ')[0] || '';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-surface/40 px-6 backdrop-blur-md">
      <button
        onClick={onOpenCommandPalette}
        className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3.5 py-2 text-sm text-muted transition-colors hover:bg-white/[0.06]"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-tabular text-muted">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3">
        <button className="relative rounded-xl border border-border bg-white/[0.03] p-2.5 text-muted transition-colors hover:bg-white/[0.06]" aria-label="Notifications">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-white/[0.03] py-1.5 pl-1.5 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-violet-magenta text-xs font-semibold text-white">
            {greetingName ? greetingName[0].toUpperCase() : '?'}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-medium text-ink">{user?.name || 'Loading…'}</div>
            <div className="text-[10px] text-muted">{user?.role?.replace('_', ' ') || ''}</div>
          </div>
          <button onClick={logout} className="ml-2 text-[11px] text-muted hover:text-ink">Sign out</button>
        </div>
      </div>
    </header>
  );
}
