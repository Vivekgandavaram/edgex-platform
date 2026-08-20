const mongoose = require('mongoose');

const PERMISSIONS = [
  'dashboard.read',
  'devices.read', 'devices.create', 'devices.update', 'devices.delete',
  'sensors.read', 'sensors.create', 'sensors.update', 'sensors.delete',
  'api.read', 'api.create', 'api.rotate', 'api.revoke',
  'readings.read', 'readings.delete', 'analytics.read',
  'alerts.read', 'alerts.create', 'alerts.update',
  'users.read', 'users.create', 'users.update', 'users.disable',
  'admins.read', 'admins.create', 'admins.update', 'admins.disable',
  'roles.read', 'roles.update',
  'audit.read',
  'system.settings',
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false }, // null for Google-only accounts
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: { type: String },

    role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'USER'], default: 'USER', index: true },
    permissions: [{ type: String, enum: PERMISSIONS }],

    // Resource-level scope: which devices/locations this user/admin can access.
    // Empty array + role ADMIN/SUPER_ADMIN with global flag = full access.
    deviceScope: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    locationScope: [{ type: String }],
    hasGlobalAccess: { type: Boolean, default: false },

    status: { type: String, enum: ['ACTIVE', 'DISABLED', 'PENDING'], default: 'PENDING' },
    emailVerified: { type: Boolean, default: false },

    lastLoginAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
module.exports.PERMISSIONS = PERMISSIONS;
