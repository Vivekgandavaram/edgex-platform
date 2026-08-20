const router = require('express').Router();
const ctrl = require('../controllers/readController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.get('/', requireAuth, requirePermission('readings.read'), ctrl.read);
router.delete('/:id', requireAuth, requirePermission('readings.delete'), ctrl.deleteReading);

module.exports = router;
