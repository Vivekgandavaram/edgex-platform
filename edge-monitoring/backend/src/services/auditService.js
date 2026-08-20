const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit logging. Never let a logging failure break the request.
exports.record = async ({ actor, action, resourceType, resourceId, details, ipAddress }) => {
  try {
    await AuditLog.create({
      actorId: actor?._id,
      actorName: actor?.name || 'System',
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('[audit] failed to record event:', err.message);
  }
};
