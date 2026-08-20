const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true }, // human-facing e.g. EDGE-001
    name: { type: String, required: true, trim: true },
    description: { type: String },
    controllerType: { type: String, default: 'generic' }, // esp32, raspberry-pi, plc-gateway, custom...
    location: { type: String },

    status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'OFFLINE', index: true },
    firmwareVersion: { type: String },
    ipAddress: { type: String },
    lastSeenAt: { type: Date },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

deviceSchema.index({ status: 1, lastSeenAt: -1 });

module.exports = mongoose.model('Device', deviceSchema);
