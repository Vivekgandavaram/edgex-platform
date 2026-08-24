import { Search, Bell, Code2, Sun, Moon, UserCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { hasPermission } from '../../lib/permissions';
import { useTheme } from '../../lib/theme.jsx';

export default function TopBar({ onOpenCommandPalette }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const greetingName = user?.name?.split(' ')[0] || '';

  useEffect(() => {
    const close = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-surface/40 px-4 backdrop-blur-md sm:gap-4 sm:px-6">
      <button
        onClick={onOpenCommandPalette}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-white/[0.03] p-2.5 text-muted transition-colors hover:bg-white/[0.06] sm:w-full sm:max-w-sm sm:px-3.5 sm:py-2"
        aria-label="Search"
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
        <span className="hidden flex-1 text-left sm:block">Search anything…</span>
        <kbd className="hidden rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-tabular text-muted sm:block">⌘K</kbd>
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/api-docs" title="Open API view" aria-label="Open API view" className="hidden rounded-xl border border-border bg-white/[0.03] p-2.5 text-muted transition-colors hover:bg-white/[0.06] sm:block"><Code2 className="h-4 w-4" /></Link>
        <button onClick={toggleTheme} title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} className="hidden rounded-xl border border-border bg-white/[0.03] p-2.5 text-muted transition-colors hover:bg-white/[0.06] sm:block">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <button className="relative rounded-xl border border-border bg-white/[0.03] p-2.5 text-muted transition-colors hover:bg-white/[0.06]" aria-label="Notifications">
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/[0.03] text-muted transition-colors hover:bg-white/[0.06] sm:hidden" aria-label="Open profile menu" aria-expanded={profileOpen}>
            <UserCircle className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2.5 rounded-xl border border-border bg-white/[0.03] py-1.5 pl-1.5 pr-3 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-violet-magenta text-xs font-semibold text-white">
              {greetingName ? greetingName[0].toUpperCase() : '?'}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium text-ink">{user?.name || 'Loading…'}</div>
              <div className="text-[10px] text-muted">{user?.role?.replace('_', ' ') || ''}</div>
            </div>
            <button onClick={logout} className="ml-2 text-[11px] text-muted hover:text-ink">Sign out</button>
          </div>
          {profileOpen && <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-border bg-surface p-3 shadow-glass sm:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-violet-magenta text-xs font-semibold text-white">{greetingName ? greetingName[0].toUpperCase() : '?'}</div>
                <div className="min-w-0 leading-tight"><div className="truncate text-sm font-medium text-ink">{user?.name || 'Loading…'}</div><div className="mt-1 text-[10px] uppercase tracking-wide text-muted">{user?.role?.replace('_', ' ') || ''}</div></div>
              </div>
              <button onClick={() => setProfileOpen(false)} aria-label="Close profile menu" className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <button onClick={logout} className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted hover:bg-white/[0.06] hover:text-ink">Sign out</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
