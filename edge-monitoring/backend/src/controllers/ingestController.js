const ApiKeyModel = require('../models/ApiKey');
const Device = require('../models/Device');
const Sensor = require('../models/Sensor');
const Reading = require('../models/Reading');
const Alert = require('../models/Alert');
const AlertRule = require('../models/AlertRule');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const bcrypt = require('bcryptjs');

// Resolves the raw API key from the Authorization header or body, finds the
// matching hash, and attaches the ApiKey + Device documents.
async function resolveWriteKey(req) {
  const header = req.headers.authorization || '';
  const rawKey = header.startsWith('Bearer ') ? header.slice(7) : req.body?.apiKey;
  if (!rawKey) throw new ApiError(401, 'MISSING_API_KEY', 'Provide an API key via Authorization: Bearer <key>.');

  // Keys are hashed at rest, so we must compare against active WRITE keys.
  // In a high-volume system this lookup would be optimized (e.g. keyed by a
  // non-secret key ID prefix); kept simple here for clarity.
  const candidates = await ApiKeyModel.find({ type: 'WRITE', status: 'ACTIVE' }).select('+keyHash');
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(rawKey, candidate.keyHash)) {
      const device = await Device.findById(candidate.deviceId);
      if (!device) continue;
      return { apiKey: candidate, device };
    }
  }
  throw new ApiError(401, 'INVALID_API_KEY', 'The API key is invalid or revoked.');
}

// POST /api/v1/write
// Universal sensor ingestion endpoint. Sensor-agnostic: accepts any metric names.
exports.write = asyncHandler(async (req, res) => {
  const { apiKey, device } = await resolveWriteKey(req);

  const { data, timestamp, metadata } = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Body must include a "data" object of metric:value pairs.');
  }

  const ts = timestamp ? new Date(timestamp) : new Date();
  const readingDocs = [];

  for (const [metric, value] of Object.entries(data)) {
    // Auto-provision the sensor definition on first sighting of a new metric.
    // eslint-disable-next-line no-await-in-loop
    let sensor = await Sensor.findOne({ deviceId: device._id, name: metric });
    if (!sensor) {
      const isVector = value && typeof value === 'object';
      // eslint-disable-next-line no-await-in-loop
      sensor = await Sensor.create({
        deviceId: device._id,
        name: metric,
        type: isVector ? 'vector' : 'numeric',
        dataType: isVector ? 'object' : 'float',
      });
    }

    const isVector = value && typeof value === 'object';
    readingDocs.push({
      deviceId: device._id,
      sensorId: sensor._id,
      metric,
      value: isVector ? undefined : Number(value),
      values: isVector ? value : undefined,
      timestamp: ts,
      metadata: metadata || {},
    });
  }

  await Reading.insertMany(readingDocs);

  device.status = 'ONLINE';
  device.lastSeenAt = ts;
  if (metadata?.ip) device.ipAddress = metadata.ip;
  await device.save();

  apiKey.lastUsedAt = new Date();
  apiKey.requestCount += 1;
  await apiKey.save();

  // Evaluate simple threshold alert rules for the metrics just written.
  const rules = await AlertRule.find({ deviceId: device._id, enabled: true, metric: { $in: Object.keys(data) } });
  for (const rule of rules) {
    const value = Number(data[rule.metric]);
    if (Number.isNaN(value)) continue;
    let breached = false;
    if (rule.operator === '>') breached = value > rule.threshold;
    else if (rule.operator === '<') breached = value < rule.threshold;
    else if (rule.operator === '>=') breached = value >= rule.threshold;
    else if (rule.operator === '<=') breached = value <= rule.threshold;
    else if (rule.operator === '==') breached = value === rule.threshold;
    else if (rule.operator === 'between') breached = value >= rule.threshold && value <= rule.thresholdMax;

    if (breached) {
      // eslint-disable-next-line no-await-in-loop
      await Alert.create({
        ruleId: rule._id,
        deviceId: device._id,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        severity: rule.severity,
        status: 'ACTIVE',
      });
    }
  }

  const io = req.app.get('io');
  if (io) io.to(`device:${device._id}`).emit('reading', { deviceId: device.deviceId, timestamp: ts, data });

  res.json({ success: true, message: 'Data received', deviceId: device.deviceId, timestamp: ts.toISOString() });
});
