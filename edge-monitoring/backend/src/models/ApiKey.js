const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema(
  {
    apiId: { type: String, required: true, unique: true }, // human-facing e.g. API001
    type: { type: String, enum: ['WRITE', 'READ'], required: true, index: true },
    keyHash: { type: String, required: true, select: false }, // never store raw key
    keyPreview: { type: String, required: true }, // e.g. sk_live_••••••••91KD

    // WRITE keys are assigned to a single device.
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
    // READ keys are assigned to a user and optionally scoped further.
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: ['ACTIVE', 'REVOKED', 'DISABLED'], default: 'ACTIVE', index: true },
    lastUsedAt: { type: Date },
    requestCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', apiKeySchema);
