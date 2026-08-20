const ApiKey = require('../models/ApiKey');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const audit = require('../services/auditService');
const email = require('../services/emailService');
const { generateRawKey, previewOf, hashKey, nextApiId } = require('../utils/apiKey');

// GET /api/v1/api-keys
exports.listApiKeys = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, type, status, deviceId } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (deviceId) filter.deviceId = deviceId;

  const [keys, total] = await Promise.all([
    ApiKey.find(filter)
      .populate('deviceId', 'deviceId name location')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    ApiKey.countDocuments(filter),
  ]);

  res.json({ success: true, data: { apiKeys: keys, total, page: Number(page), limit: Number(limit) } });
});

// POST /api/v1/api-keys  { type: 'WRITE'|'READ', deviceId?, assignedTo? }
exports.createApiKey = asyncHandler(async (req, res) => {
  const { type, deviceId, assignedTo } = req.body;
  if (!['WRITE', 'READ'].includes(type)) throw new ApiError(400, 'VALIDATION_ERROR', 'type must be WRITE or READ.');
  if (type === 'WRITE' && !deviceId) throw new ApiError(400, 'VALIDATION_ERROR', 'deviceId is required for WRITE keys.');
  if (type === 'READ' && !assignedTo) throw new ApiError(400, 'VALIDATION_ERROR', 'assignedTo is required for READ keys.');

  const rawKey = generateRawKey();
  const keyHash = await hashKey(rawKey);
  const count = await ApiKey.countDocuments();

  const apiKey = await ApiKey.create({
    apiId: nextApiId(count + 1),
    type,
    keyHash,
    keyPreview: previewOf(rawKey),
    deviceId: type === 'WRITE' ? deviceId : undefined,
    assignedTo: type === 'READ' ? assignedTo : undefined,
    status: 'ACTIVE',
    createdBy: req.user._id,
  });

  await audit.record({ actor: req.user, action: 'api_key.created', resourceType: 'ApiKey', resourceId: apiKey.apiId, ipAddress: req.ip });
  await email.sendApiKeyCreatedEmail(req.user.email, apiKey.apiId);

  res.status(201).json({
    success: true,
    data: { apiKey: { ...apiKey.toObject(), rawKey }, note: 'This key is shown only once. Store it securely.' },
  });
});

// POST /api/v1/api-keys/:id/rotate
exports.rotateApiKey = asyncHandler(async (req, res) => {
  const apiKey = await ApiKey.findById(req.params.id);
  if (!apiKey) throw new ApiError(404, 'NOT_FOUND', 'API key not found.');
  if (apiKey.status !== 'ACTIVE') throw new ApiError(400, 'INVALID_STATE', 'Only active keys can be rotated.');

  const rawKey = generateRawKey();
  apiKey.keyHash = await hashKey(rawKey);
  apiKey.keyPreview = previewOf(rawKey);
  await apiKey.save();

  await audit.record({ actor: req.user, action: 'api_key.rotated', resourceType: 'ApiKey', resourceId: apiKey.apiId, ipAddress: req.ip });
  res.json({ success: true, data: { apiKey: { ...apiKey.toObject(), rawKey }, note: 'This key is shown only once.' } });
});

// POST /api/v1/api-keys/:id/revoke
exports.revokeApiKey = asyncHandler(async (req, res) => {
  const apiKey = await ApiKey.findById(req.params.id);
  if (!apiKey) throw new ApiError(404, 'NOT_FOUND', 'API key not found.');

  apiKey.status = 'REVOKED';
  await apiKey.save();

  await audit.record({ actor: req.user, action: 'api_key.revoked', resourceType: 'ApiKey', resourceId: apiKey.apiId, ipAddress: req.ip });
  await email.sendApiKeyRevokedEmail(req.user.email, apiKey.apiId);

  res.json({ success: true, data: { apiKey } });
});
