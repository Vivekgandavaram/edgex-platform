const Device = require('../models/Device');
const Reading = require('../models/Reading');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

function scopedDeviceFilter(user) {
  if (user.role === 'SUPER_ADMIN' || user.hasGlobalAccess) return {};
  const or = [];
  if (user.deviceScope?.length) or.push({ _id: { $in: user.deviceScope } });
  if (user.locationScope?.length) or.push({ location: { $in: user.locationScope } });
  return or.length ? { $or: or } : { _id: null };
}

// GET /api/v1/read?deviceId=&sensor=&from=&to=&limit=&page=
// Universal, permission-scoped read endpoint over ingested readings.
exports.read = asyncHandler(async (req, res) => {
  const { deviceId, sensor, from, to, limit = 100, page = 1, sort = 'desc' } = req.query;

  const deviceFilter = { ...scopedDeviceFilter(req.user) };
  if (deviceId) deviceFilter.$and = [...(deviceFilter.$and || []), { $or: [{ deviceId }, { _id: deviceId.match(/^[0-9a-fA-F]{24}$/) ? deviceId : null }] }];

  const allowedDevices = await Device.find(deviceFilter).select('_id deviceId');
  if (deviceId && allowedDevices.length === 0) {
    throw new ApiError(403, 'PERMISSION_DENIED', 'You do not have access to this device, or it does not exist.');
  }

  const readingFilter = { deviceId: { $in: allowedDevices.map((d) => d._id) } };
  if (sensor) readingFilter.metric = sensor;
  if (from || to) {
    readingFilter.timestamp = {};
    if (from) readingFilter.timestamp.$gte = new Date(from);
    if (to) readingFilter.timestamp.$lte = new Date(to);
  }

  const cappedLimit = Math.min(Number(limit) || 100, 1000);
  const [readings, total] = await Promise.all([
    Reading.find(readingFilter)
      .sort({ timestamp: sort === 'asc' ? 1 : -1 })
      .skip((Number(page) - 1) * cappedLimit)
      .limit(cappedLimit),
    Reading.countDocuments(readingFilter),
  ]);

  res.json({ success: true, data: { readings, total, page: Number(page), limit: cappedLimit } });
});

// DELETE /api/v1/read/:id
exports.deleteReading = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reading = await Reading.findById(id);
  if (!reading) throw new ApiError(404, 'NOT_FOUND', 'Reading not found.');

  const device = await Device.findById(reading.deviceId).select('_id deviceId');
  if (!device) throw new ApiError(404, 'NOT_FOUND', 'Associated device not found.');

  const allowed = req.user.role === 'SUPER_ADMIN' || req.user.hasGlobalAccess ||
    req.user.deviceScope?.some((d) => d.toString() === device._id.toString()) ||
    (device.location && req.user.locationScope?.includes(device.location));

  if (!allowed) throw new ApiError(403, 'PERMISSION_DENIED', 'You do not have access to this reading.');

  await reading.deleteOne();
  res.json({ success: true, data: { message: 'Reading deleted.' } });
});
