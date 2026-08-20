import GlassPanel from '../components/ui/GlassPanel';
import StatusBadge from '../components/ui/StatusBadge';

const ROLES = [
  { name: 'SUPER ADMIN', desc: 'Global access to every device, user, and setting. Can manage administrators.', color: 'violet' },
  { name: 'ADMINISTRATOR', desc: 'Scoped access defined by granted permissions and assigned devices/locations.', color: 'cyan' },
  { name: 'USER', desc: 'Read-only access to explicitly assigned devices.', color: 'emerald' },
];

const PERMISSION_GROUPS = [
  { group: 'Devices', perms: ['devices.read', 'devices.create', 'devices.update', 'devices.delete'] },
  { group: 'Sensors', perms: ['sensors.read', 'sensors.create', 'sensors.update', 'sensors.delete'] },
  { group: 'API', perms: ['api.read', 'api.create', 'api.rotate', 'api.revoke'] },
  { group: 'Analytics & Alerts', perms: ['readings.read', 'analytics.read', 'alerts.read', 'alerts.create', 'alerts.update'] },
  { group: 'Organization', perms: ['users.read', 'users.create', 'users.update', 'admins.read', 'admins.create'] },
  { group: 'Security', perms: ['audit.read', 'system.settings'] },
];

export default function RolesPermissions() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-muted">EdgeX enforces every permission server-side — this reference shows what each grants.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <GlassPanel key={r.name} className="p-5">
            <StatusBadge status="ACTIVE" label={r.name} />
            <p className="mt-3 text-sm text-muted">{r.desc}</p>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Permission Reference</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PERMISSION_GROUPS.map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.perms.map((p) => (
                  <span key={p} className="rounded-full border border-border bg-white/[0.03] px-2.5 py-1 font-tabular text-[11px] text-muted">{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
