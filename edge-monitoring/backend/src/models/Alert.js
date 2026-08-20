const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlertRule' },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    metric: { type: String, required: true },
    value: { type: Number },
    threshold: { type: Number },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], required: true },
    status: { type: String, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'], default: 'ACTIVE', index: true },
    resolvedAt: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
