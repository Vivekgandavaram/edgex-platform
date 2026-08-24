const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/audit-logs
exports.listAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, actorId, resourceId, from, to } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (actorId) filter.actorId = actorId;
  if (resourceId) filter.resourceId = resourceId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: { logs, total, page: Number(page), limit: Number(limit) } });
});
