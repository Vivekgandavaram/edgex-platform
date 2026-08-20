const Alert = require('../models/Alert');
const AlertRule = require('../models/AlertRule');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const audit = require('../services/auditService');

// GET /api/v1/alerts?status=&severity=&deviceId=
exports.listAlerts = asyncHandler(async (req, res) => {
  const { status, severity, deviceId, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (deviceId) filter.deviceId = deviceId;

  const [alerts, total] = await Promise.all([
    Alert.find(filter).populate('deviceId', 'deviceId name location').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    Alert.countDocuments(filter),
  ]);
  res.json({ success: true, data: { alerts, total, page: Number(page), limit: Number(limit) } });
});

// POST /api/v1/alerts/:id/acknowledge
exports.acknowledgeAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) throw new ApiError(404, 'NOT_FOUND', 'Alert not found.');
  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = req.user._id;
  await alert.save();
  await audit.record({ actor: req.user, action: 'alert.acknowledged', resourceType: 'Alert', resourceId: alert._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { alert } });
});

// POST /api/v1/alerts/:id/resolve
exports.resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) throw new ApiError(404, 'NOT_FOUND', 'Alert not found.');
  alert.status = 'RESOLVED';
  alert.resolvedAt = new Date();
  await alert.save();
  await audit.record({ actor: req.user, action: 'alert.resolved', resourceType: 'Alert', resourceId: alert._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { alert } });
});

// GET/POST /api/v1/alert-rules
exports.listAlertRules = asyncHandler(async (req, res) => {
  const rules = await AlertRule.find(req.query.deviceId ? { deviceId: req.query.deviceId } : {}).populate('deviceId', 'deviceId name');
  res.json({ success: true, data: { rules } });
});

exports.createAlertRule = asyncHandler(async (req, res) => {
  const { name, deviceId, metric, operator, threshold, thresholdMax, durationSeconds, severity } = req.body;
  if (!name || !deviceId || !metric || !operator || threshold === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'name, deviceId, metric, operator and threshold are required.');
  }
  const rule = await AlertRule.create({ name, deviceId, metric, operator, threshold, thresholdMax, durationSeconds, severity, createdBy: req.user._id });
  await audit.record({ actor: req.user, action: 'alert_rule.created', resourceType: 'AlertRule', resourceId: rule._id.toString(), ipAddress: req.ip });
  res.status(201).json({ success: true, data: { rule } });
});
