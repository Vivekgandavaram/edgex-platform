const Sensor = require('../models/Sensor');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const audit = require('../services/auditService');

// GET /api/v1/devices/:id/sensors
exports.listSensors = asyncHandler(async (req, res) => {
  const sensors = await Sensor.find({ deviceId: req.targetDevice._id }).sort({ name: 1 });
  res.json({ success: true, data: { sensors } });
});

// POST /api/v1/devices/:id/sensors
exports.createSensor = asyncHandler(async (req, res) => {
  const { name, type, unit, description, dataType, minValue, maxValue, samplingRateSeconds } = req.body;
  if (!name) throw new ApiError(400, 'VALIDATION_ERROR', 'Sensor name is required.');

  const sensor = await Sensor.create({
    deviceId: req.targetDevice._id,
    name,
    type,
    unit,
    description,
    dataType,
    minValue,
    maxValue,
    samplingRateSeconds,
  });

  await audit.record({ actor: req.user, action: 'sensor.created', resourceType: 'Sensor', resourceId: sensor._id.toString(), ipAddress: req.ip });
  res.status(201).json({ success: true, data: { sensor } });
});

// PUT /api/v1/sensors/:sensorId
exports.updateSensor = asyncHandler(async (req, res) => {
  const sensor = await Sensor.findById(req.params.sensorId);
  if (!sensor) throw new ApiError(404, 'NOT_FOUND', 'Sensor not found.');

  const allowed = ['name', 'type', 'unit', 'description', 'dataType', 'minValue', 'maxValue', 'samplingRateSeconds', 'enabled'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) sensor[field] = req.body[field];
  });
  await sensor.save();
  await audit.record({ actor: req.user, action: 'sensor.updated', resourceType: 'Sensor', resourceId: sensor._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { sensor } });
});

// DELETE /api/v1/sensors/:sensorId
exports.deleteSensor = asyncHandler(async (req, res) => {
  const sensor = await Sensor.findById(req.params.sensorId);
  if (!sensor) throw new ApiError(404, 'NOT_FOUND', 'Sensor not found.');
  await sensor.deleteOne();
  await audit.record({ actor: req.user, action: 'sensor.deleted', resourceType: 'Sensor', resourceId: req.params.sensorId, ipAddress: req.ip });
  res.json({ success: true, data: { message: 'Sensor deleted.' } });
});
