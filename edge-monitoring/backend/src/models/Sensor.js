const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    name: { type: String, required: true }, // e.g. "temperature"
    type: { type: String, default: 'numeric' }, // numeric, vector, gps, boolean, custom
    unit: { type: String },
    description: { type: String },
    dataType: { type: String, default: 'float' },
    minValue: { type: Number },
    maxValue: { type: Number },
    samplingRateSeconds: { type: Number },
    enabled: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

sensorSchema.index({ deviceId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Sensor', sensorSchema);
