export const ROUTE_PERMISSIONS = {
  '/': 'dashboard.read',
  '/live': 'dashboard.read',
  '/devices': 'devices.read',
  '/devices/:id': 'devices.read',
  '/sensors': 'sensors.read',
  '/locations': 'devices.read',
  '/analytics': 'analytics.read',
  '/alerts': 'alerts.read',
  '/api-management': 'api.read',
  '/api-docs': 'api.read',
  '/users': 'users.read',
  '/admins': 'admins.read',
  '/roles': 'roles.read',
  '/audit-logs': 'audit.read',
  '/settings': 'system.settings',
};

export function hasPermission(user, permission) {
  if (!permission) return true;
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.hasGlobalAccess) return true;
  return Boolean(user.permissions?.includes(permission));
}

export function canAccessRoute(user, pathname) {
  if (!pathname) return true;
  const match = Object.entries(ROUTE_PERMISSIONS).find(([route]) => {
    if (route.includes(':')) {
      const pattern = route.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return route === pathname;
  });

  const permission = match?.[1];
  return hasPermission(user, permission);
}
