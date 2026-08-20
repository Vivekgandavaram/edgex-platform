const Device = require('../models/Device');
const Sensor = require('../models/Sensor');
const ApiKey = require('../models/ApiKey');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const audit = require('../services/auditService');
const { generateRawKey, previewOf, hashKey, nextApiId, nextDeviceId } = require('../utils/apiKey');
const ApiKeyModel = require('../models/ApiKey');

function scopedDeviceFilter(user) {
  if (user.role === 'SUPER_ADMIN' || user.hasGlobalAccess) return {};
  const or = [];
  if (user.deviceScope?.length) or.push({ _id: { $in: user.deviceScope } });
  if (user.locationScope?.length) or.push({ location: { $in: user.locationScope } });
  return or.length ? { $or: or } : { _id: null }; // no access -> empty result set
}

// GET /api/v1/devices
exports.listDevices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, status, search } = req.query;
  const filter = scopedDeviceFilter(req.user);
  if (status) filter.status = status;
  if (search) filter.$and = [...(filter.$and || []), { $or: [{ name: new RegExp(search, 'i') }, { deviceId: new RegExp(search, 'i') }] }];

  const [devices, total] = await Promise.all([
    Device.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    Device.countDocuments(filter),
  ]);

  res.json({ success: true, data: { devices, total, page: Number(page), limit: Number(limit) } });
});

// GET /api/v1/devices/:id
exports.getDevice = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { device: req.targetDevice } });
});

// Middleware: loads device by mongo _id or human deviceId into req.targetDevice
exports.loadDevice = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const device = await Device.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { deviceId: id }] });
  if (!device) throw new ApiError(404, 'NOT_FOUND', 'Device not found.');
  req.targetDevice = device;
  next();
});

// POST /api/v1/devices
exports.createDevice = asyncHandler(async (req, res) => {
  const { name, controllerType, location, description } = req.body;
  if (!name) throw new ApiError(400, 'VALIDATION_ERROR', 'Device name is required.');

  const count = await Device.countDocuments();
  const deviceId = nextDeviceId(count + 1);

  const device = await Device.create({
    deviceId,
    name,
    controllerType: controllerType || 'generic',
    location,
    description,
    status: 'OFFLINE',
    createdBy: req.user._id,
  });

  // Auto-generate a WRITE API key for the new device, per the onboarding flow.
  const rawKey = generateRawKey();
  const keyHash = await hashKey(rawKey);
  const apiKeyCount = await ApiKeyModel.countDocuments();
  const apiKey = await ApiKeyModel.create({
    apiId: nextApiId(apiKeyCount + 1),
    type: 'WRITE',
    keyHash,
    keyPreview: previewOf(rawKey),
    deviceId: device._id,
    status: 'ACTIVE',
    createdBy: req.user._id,
  });

  await audit.record({ actor: req.user, action: 'device.created', resourceType: 'Device', resourceId: device.deviceId, ipAddress: req.ip });
  await audit.record({ actor: req.user, action: 'api_key.created', resourceType: 'ApiKey', resourceId: apiKey.apiId, ipAddress: req.ip });

  res.status(201).json({
    success: true,
    data: {
      device,
      apiKey: { apiId: apiKey.apiId, type: apiKey.type, rawKey, note: 'This key is shown only once. Store it securely.' },
    },
  });
});

// PUT /api/v1/devices/:id
exports.updateDevice = asyncHandler(async (req, res) => {
  const allowed = ['name', 'description', 'controllerType', 'location', 'firmwareVersion', 'metadata'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.targetDevice[field] = req.body[field];
  });
  await req.targetDevice.save();
  await audit.record({ actor: req.user, action: 'device.updated', resourceType: 'Device', resourceId: req.targetDevice.deviceId, ipAddress: req.ip });
  res.json({ success: true, data: { device: req.targetDevice } });
});

// DELETE /api/v1/devices/:id
exports.deleteDevice = asyncHandler(async (req, res) => {
  await Sensor.deleteMany({ deviceId: req.targetDevice._id });
  await ApiKey.updateMany({ deviceId: req.targetDevice._id }, { status: 'REVOKED' });
  await req.targetDevice.deleteOne();
  await audit.record({ actor: req.user, action: 'device.deleted', resourceType: 'Device', resourceId: req.targetDevice.deviceId, ipAddress: req.ip });
  res.json({ success: true, data: { message: 'Device deleted.' } });
});
