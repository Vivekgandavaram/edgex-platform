import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LayoutDashboard, Activity, Cpu, BellRing, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { hasPermission } from '../../lib/permissions';

const ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true, permission: 'dashboard.read' },
  { to: '/live', label: 'Live', icon: Activity, permission: 'dashboard.read' },
  { to: '/devices', label: 'Devices', icon: Cpu, permission: 'devices.read' },
  { to: '/alerts', label: 'Alerts', icon: BellRing, permission: 'alerts.read' },
  { to: '/settings', label: 'More', icon: MoreHorizontal, permission: 'system.settings' },
];

export default function MobileNav() {
  const { user } = useAuth();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border/60 bg-surface/90 py-2 backdrop-blur-lg lg:hidden">
      {ITEMS.filter(({ permission }) => hasPermission(user, permission)).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => clsx('flex flex-col items-center gap-1 px-3 py-1 text-[10px]', isActive ? 'text-cyan' : 'text-muted')}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
