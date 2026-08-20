// Development-only seed script. Creates a Super Admin, an Admin, a User,
// a few devices with sensors and sample readings, one alert rule, one
// resulting alert, and API registry entries — so the dashboard is
// immediately testable. Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Device = require('../models/Device');
const Sensor = require('../models/Sensor');
const Reading = require('../models/Reading');
const ApiKey = require('../models/ApiKey');
const AlertRule = require('../models/AlertRule');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const { hashPassword } = require('../utils/password');
const { generateRawKey, previewOf, hashKey } = require('../utils/apiKey');

async function run() {
  await mongoose.connect(env.mongodbUri);
  console.log('[seed] connected, clearing existing demo collections...');

  await Promise.all([
    User.deleteMany({}),
    Device.deleteMany({}),
    Sensor.deleteMany({}),
    Reading.deleteMany({}),
    ApiKey.deleteMany({}),
    AlertRule.deleteMany({}),
    Alert.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: env.seed.demoSuperAdminEmail,
    passwordHash: await hashPassword(env.seed.demoSuperAdminPassword),
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    hasGlobalAccess: true,
  });

  const admin = await User.create({
    name: 'Rahul Menon',
    email: 'rahul@edgex.vigotech.in',
    passwordHash: await hashPassword('ChangeMe123!'),
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    permissions: ['dashboard.read', 'devices.read', 'devices.create', 'devices.update', 'sensors.read', 'sensors.create', 'api.read', 'api.create', 'alerts.read', 'alerts.create', 'analytics.read'],
    hasGlobalAccess: true,
    createdBy: superAdmin._id,
  });

  const devicesData = [
    { name: 'Factory A — Line 1 Controller', controllerType: 'esp32', location: 'Factory A' },
    { name: 'Factory A — Vibration Monitor', controllerType: 'raspberry-pi', location: 'Factory A' },
    { name: 'Cold Storage — Environment Sensor', controllerType: 'esp32', location: 'Warehouse 2' },
  ];

  const devices = [];
  let apiSeq = 1;
  for (let i = 0; i < devicesData.length; i++) {
    const d = devicesData[i];
    const device = await Device.create({
      deviceId: `EDGE-00${i + 1}`,
      name: d.name,
      controllerType: d.controllerType,
      location: d.location,
      status: 'ONLINE',
      lastSeenAt: new Date(),
      createdBy: admin._id,
    });
    devices.push(device);

    const rawKey = generateRawKey();
    await ApiKey.create({
      apiId: `API${String(apiSeq++).padStart(3, '0')}`,
      type: 'WRITE',
      keyHash: await hashKey(rawKey),
      keyPreview: previewOf(rawKey),
      deviceId: device._id,
      status: 'ACTIVE',
      requestCount: 340 + i * 57,
      lastUsedAt: new Date(),
      createdBy: admin._id,
    });
  }

  const user = await User.create({
    name: 'Priya Sharma',
    email: 'priya@edgex.vigotech.in',
    passwordHash: await hashPassword('ChangeMe123!'),
    role: 'USER',
    status: 'ACTIVE',
    emailVerified: true,
    permissions: ['dashboard.read', 'devices.read', 'sensors.read', 'readings.read', 'readings.delete', 'analytics.read'],
    deviceScope: [devices[0]._id, devices[2]._id],
    createdBy: admin._id,
  });

  const sampleSensor = await Sensor.create({
    deviceId: devices[0]._id,
    name: 'temperature',
    type: 'numeric',
    unit: '°C',
  });

  const demoReading = await Reading.create({
    deviceId: devices[0]._id,
    sensorId: sampleSensor._id,
    metric: 'temperature',
    value: 24.8,
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    metadata: { seed: true, removable: true, owner: 'priya@edgex.vigotech.in' },
  });

  const rawReadKey = generateRawKey();
  await ApiKey.create({
    apiId: `API${String(apiSeq++).padStart(3, '0')}`,
    type: 'READ',
    keyHash: await hashKey(rawReadKey),
    keyPreview: previewOf(rawReadKey),
    assignedTo: user._id,
    status: 'ACTIVE',
    requestCount: 12,
    createdBy: admin._id,
  });

  // Sensors + a few hours of sample readings per device.
  const metricSets = [
    { temperature: [18, 32], humidity: [30, 70] },
    { x: [-2, 2], y: [-2, 2], z: [0, 10], frequency: [100, 200] },
    { temperature: [-5, 5], humidity: [40, 60] },
  ];

  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    const metrics = metricSets[i];
    const sensors = {};
    for (const metric of Object.keys(metrics)) {
      // eslint-disable-next-line no-await-in-loop
      sensors[metric] = await Sensor.create({ deviceId: device._id, name: metric, type: 'numeric', unit: metric.includes('temp') ? '°C' : metric.includes('hum') ? '%' : '' });
    }

    const now = Date.now();
    const readings = [];
    for (let t = 0; t < 60; t++) {
      const ts = new Date(now - t * 5 * 60 * 1000); // every 5 min, last 5 hours
      for (const [metric, [min, max]] of Object.entries(metrics)) {
        readings.push({
          deviceId: device._id,
          sensorId: sensors[metric]._id,
          metric,
          value: Number((min + Math.random() * (max - min)).toFixed(2)),
          timestamp: ts,
        });
      }
    }
    // eslint-disable-next-line no-await-in-loop
    await Reading.insertMany(readings);
  }

  const rule = await AlertRule.create({
    name: 'Cold storage over-temperature',
    deviceId: devices[2]._id,
    metric: 'temperature',
    operator: '>',
    threshold: 4,
    severity: 'WARNING',
    createdBy: admin._id,
  });

  await Alert.create({
    ruleId: rule._id,
    deviceId: devices[2]._id,
    metric: 'temperature',
    value: 4.8,
    threshold: 4,
    severity: 'WARNING',
    status: 'ACTIVE',
  });

  await AuditLog.create([
    { actorId: superAdmin._id, actorName: superAdmin.name, action: 'admin.created', resourceType: 'User', resourceId: admin._id.toString() },
    { actorId: admin._id, actorName: admin.name, action: 'device.created', resourceType: 'Device', resourceId: devices[0].deviceId },
    { actorId: admin._id, actorName: admin.name, action: 'api_key.created', resourceType: 'ApiKey', resourceId: 'API001' },
  ]);

  console.log('[seed] done.');
  console.log(`[seed] Demo Super Admin login: ${env.seed.demoSuperAdminEmail} / ${env.seed.demoSuperAdminPassword}`);
  console.log('[seed] Demo Admin login: rahul@edgex.vigotech.in / ChangeMe123!');
  console.log('[seed] Demo User login: priya@edgex.vigotech.in / ChangeMe123!');
  console.log(`[seed] Note: ${env.superAdminEmail} is NOT seeded — they become the real`);
  console.log('[seed] SUPER_ADMIN automatically the moment they sign up or sign in on the site.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
