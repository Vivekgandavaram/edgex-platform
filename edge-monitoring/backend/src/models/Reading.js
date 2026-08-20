const mongoose = require('mongoose');

// A single ingested data point. Supports scalar (value) or multi-axis (values) metrics.
const readingSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
    sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor' },
    metric: { type: String, required: true }, // "temperature", "acceleration", ...
    value: { type: Number }, // scalar metrics
    values: { type: mongoose.Schema.Types.Mixed }, // multi-axis metrics, e.g. {x,y,z}
    timestamp: { type: Date, required: true, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: false }
);

readingSchema.index({ deviceId: 1, timestamp: -1 });
readingSchema.index({ sensorId: 1, timestamp: -1 });
readingSchema.index({ metric: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', readingSchema);
