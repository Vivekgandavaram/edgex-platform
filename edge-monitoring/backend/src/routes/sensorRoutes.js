const router = require('express').Router();
const ctrl = require('../controllers/sensorController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.use(requireAuth);
router.put('/:sensorId', requirePermission('sensors.update'), ctrl.updateSensor);
router.delete('/:sensorId', requirePermission('sensors.delete'), ctrl.deleteSensor);

module.exports = router;
