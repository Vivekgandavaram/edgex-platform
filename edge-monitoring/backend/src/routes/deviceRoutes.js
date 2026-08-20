const router = require('express').Router();
const ctrl = require('../controllers/deviceController');
const sensorCtrl = require('../controllers/sensorController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission, requireDeviceAccess } = require('../middleware/permission');

router.use(requireAuth);

router.get('/', requirePermission('devices.read'), ctrl.listDevices);
router.post('/', requirePermission('devices.create'), ctrl.createDevice);

router.get('/:id', ctrl.loadDevice, requireDeviceAccess(), ctrl.getDevice);
router.put('/:id', requirePermission('devices.update'), ctrl.loadDevice, requireDeviceAccess(), ctrl.updateDevice);
router.delete('/:id', requirePermission('devices.delete'), ctrl.loadDevice, requireDeviceAccess(), ctrl.deleteDevice);

router.get('/:id/sensors', ctrl.loadDevice, requireDeviceAccess(), sensorCtrl.listSensors);
router.post('/:id/sensors', requirePermission('sensors.create'), ctrl.loadDevice, requireDeviceAccess(), sensorCtrl.createSensor);

module.exports = router;
