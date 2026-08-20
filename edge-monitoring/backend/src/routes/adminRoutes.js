const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/permission');

router.use(requireAuth, requireRole('SUPER_ADMIN'));
router.get('/', ctrl.listAdmins);
router.post('/', ctrl.createAdmin);
router.put('/:id', ctrl.updateAdmin);
router.post('/:id/disable', ctrl.disableAdmin);

module.exports = router;
