const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const audit = require('../services/auditService');
const email = require('../services/emailService');
const crypto = require('crypto');
const { hashPassword } = require('../utils/password');
const env = require('../config/env');

// GET /api/v1/admins
exports.listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).sort({ createdAt: -1 });
  res.json({ success: true, data: { admins } });
});

// POST /api/v1/admins  (Super Admin only)
exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, permissions, deviceScope, locationScope } = req.body;
  if (!name || !rawEmail) throw new ApiError(400, 'VALIDATION_ERROR', 'Name and email are required.');

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'EMAIL_IN_USE', 'A user with this email already exists.');

  const tempPassword = crypto.randomBytes(12).toString('hex');
  const admin = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await hashPassword(tempPassword),
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: permissions || [],
    deviceScope: deviceScope || [],
    locationScope: locationScope || [],
    createdBy: req.user._id,
  });

  const setupToken = crypto.randomBytes(24).toString('hex'); // pair with a real password-set flow in production
  await email.sendAdminInviteEmail(admin.email, admin.name, `${env.appUrl}/reset-password?invite=${setupToken}&email=${encodeURIComponent(admin.email)}`);
  await audit.record({ actor: req.user, action: 'admin.created', resourceType: 'User', resourceId: admin._id.toString(), ipAddress: req.ip });

  res.status(201).json({ success: true, data: { admin } });
});

// PUT /api/v1/admins/:id
exports.updateAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.id, role: { $in: ['ADMIN', 'SUPER_ADMIN'] } });
  if (!admin) throw new ApiError(404, 'NOT_FOUND', 'Admin not found.');

  const allowed = ['name', 'permissions', 'deviceScope', 'locationScope', 'hasGlobalAccess'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) admin[f] = req.body[f]; });
  await admin.save();
  await audit.record({ actor: req.user, action: 'admin.updated', resourceType: 'User', resourceId: admin._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { admin } });
});

// POST /api/v1/admins/:id/disable
exports.disableAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ _id: req.params.id, role: 'ADMIN' }); // super admins cannot be disabled here
  if (!admin) throw new ApiError(404, 'NOT_FOUND', 'Admin not found.');
  admin.status = admin.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
  await admin.save();
  await audit.record({ actor: req.user, action: 'admin.disabled', resourceType: 'User', resourceId: admin._id.toString(), details: { status: admin.status }, ipAddress: req.ip });
  res.json({ success: true, data: { admin } });
});
