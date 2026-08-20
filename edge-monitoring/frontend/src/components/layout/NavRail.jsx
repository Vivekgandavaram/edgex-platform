import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Activity, Cpu, Radio, MapPin, LineChart, BellRing,
  KeyRound, BookOpen, Users, ShieldCheck, Lock, ScrollText, Settings,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { hasPermission } from '../../lib/permissions';

const SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, permission: 'dashboard.read' },
      { to: '/live', label: 'Live Monitoring', icon: Activity, permission: 'dashboard.read' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { to: '/devices', label: 'Devices', icon: Cpu, permission: 'devices.read' },
      { to: '/sensors', label: 'Sensors', icon: Radio, permission: 'sensors.read' },
      { to: '/locations', label: 'Locations', icon: MapPin, permission: 'devices.read' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics', label: 'Analytics', icon: LineChart, permission: 'analytics.read' },
      { to: '/alerts', label: 'Alerts', icon: BellRing, permission: 'alerts.read' },
    ],
  },
  {
    label: 'Access',
    items: [
      { to: '/api-management', label: 'API Management', icon: KeyRound, permission: 'api.read' },
      { to: '/api-docs', label: 'API Documentation', icon: BookOpen, permission: 'api.read' },
    ],
  },
  {
    label: 'Organization',
    items: [
      { to: '/users', label: 'Users', icon: Users, permission: 'users.read' },
      { to: '/admins', label: 'Administrators', icon: ShieldCheck, permission: 'admins.read' },
      { to: '/roles', label: 'Roles & Permissions', icon: Lock, permission: 'roles.read' },
    ],
  },
  {
    label: 'Security',
    items: [{ to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, permission: 'audit.read' }],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings, permission: 'system.settings' }],
  },
];

export default function NavRail() {
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-border/60 bg-surface/60 px-4 py-6 lg:flex overflow-y-auto">
      <div className="flex items-center gap-2 px-2">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-blue-cyan">
          <div className="absolute inset-0 rounded-lg bg-gradient-blue-cyan opacity-40 blur-md" aria-hidden />
          <span className="relative font-display text-[0.9rem] font-black tracking-[-0.14em] text-white">eX</span>
        </div>
        <div>
          <div className="font-display text-base font-bold tracking-tight text-ink">
            Edge<span className="bg-gradient-blue-cyan bg-clip-text text-transparent">X</span>
          </div>
          <div className="text-[10px] text-muted">Intelligence for the physical world.</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6">
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => hasPermission(user, item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
                {section.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {visibleItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200',
                        isActive
                          ? 'glass-panel-strong text-ink shadow-glow'
                          : 'text-muted hover:bg-white/[0.04] hover:text-ink'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={clsx('h-4 w-4 shrink-0', isActive ? 'text-cyan' : 'text-muted group-hover:text-ink')}
                          strokeWidth={1.75}
                        />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
