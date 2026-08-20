const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    metric: { type: String, required: true },
    operator: { type: String, enum: ['>', '<', '>=', '<=', '==', 'between'], required: true },
    threshold: { type: Number, required: true },
    thresholdMax: { type: Number }, // used with 'between'
    durationSeconds: { type: Number, default: 0 }, // condition must hold this long
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlertRule', alertRuleSchema);
