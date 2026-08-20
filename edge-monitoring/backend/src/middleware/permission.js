const ApiError = require('../utils/apiError');

// Usage: router.get('/devices', requireAuth, requirePermission('devices.read'), handler)
exports.requirePermission = (permission) => (req, res, next) => {
  const user = req.user;
  if (!user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));

  if (user.role === 'SUPER_ADMIN') return next();
  if (user.permissions?.includes(permission)) return next();

  return next(new ApiError(403, 'PERMISSION_DENIED', `Missing permission: ${permission}`));
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'PERMISSION_DENIED', 'Insufficient role for this action.'));
  }
  next();
};

// Ensures the user can access a specific device (by ObjectId string), based on
// global access flag, explicit device scope, or location scope. Attaches nothing;
// throws if denied. Call after loading the target device onto req.targetDevice.
exports.requireDeviceAccess = () => (req, res, next) => {
  const user = req.user;
  const device = req.targetDevice;
  if (!device) return next(new ApiError(404, 'NOT_FOUND', 'Device not found.'));

  if (user.role === 'SUPER_ADMIN' || user.hasGlobalAccess) return next();

  const inDeviceScope = user.deviceScope?.some((id) => id.toString() === device._id.toString());
  const inLocationScope = device.location && user.locationScope?.includes(device.location);

  if (inDeviceScope || inLocationScope) return next();

  return next(new ApiError(403, 'PERMISSION_DENIED', 'You do not have access to this device.'));
};
