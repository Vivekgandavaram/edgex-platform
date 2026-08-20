const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.use(requireAuth);
router.get('/alerts', requirePermission('alerts.read'), ctrl.listAlerts);
router.post('/alerts/:id/acknowledge', requirePermission('alerts.update'), ctrl.acknowledgeAlert);
router.post('/alerts/:id/resolve', requirePermission('alerts.update'), ctrl.resolveAlert);
router.get('/alert-rules', requirePermission('alerts.read'), ctrl.listAlertRules);
router.post('/alert-rules', requirePermission('alerts.create'), ctrl.createAlertRule);

module.exports = router;
