const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const audit = require('../services/auditService');
const { hashPassword, isStrongPassword } = require('../utils/password');
const crypto = require('crypto');

// GET /api/v1/users  (role=USER)
exports.listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, search, status } = req.query;
  const filter = { role: 'USER' };
  if (status) filter.status = status;
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: { users, total, page: Number(page), limit: Number(limit) } });
});

// POST /api/v1/users  (create/invite a user)
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, deviceScope, locationScope } = req.body;
  if (!name || !rawEmail) throw new ApiError(400, 'VALIDATION_ERROR', 'Name and email are required.');

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'EMAIL_IN_USE', 'A user with this email already exists.');

  // Invited users get a random temporary password; they'll reset it via email.
  const tempPassword = crypto.randomBytes(12).toString('hex');
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await hashPassword(tempPassword),
    role: 'USER',
    status: 'ACTIVE',
    deviceScope: deviceScope || [],
    locationScope: locationScope || [],
    createdBy: req.user._id,
  });

  await audit.record({ actor: req.user, action: 'user.created', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });
  res.status(201).json({ success: true, data: { user } });
});

// PUT /api/v1/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'USER' });
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');

  const allowed = ['name', 'deviceScope', 'locationScope'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });
  await user.save();
  await audit.record({ actor: req.user, action: 'user.updated', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { user } });
});

// POST /api/v1/users/:id/disable
exports.disableUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'USER' });
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');
  user.status = user.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
  await user.save();
  await audit.record({ actor: req.user, action: 'user.disabled', resourceType: 'User', resourceId: user._id.toString(), details: { status: user.status }, ipAddress: req.ip });
  res.json({ success: true, data: { user } });
});
