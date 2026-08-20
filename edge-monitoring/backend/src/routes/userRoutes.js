const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.use(requireAuth);
router.get('/', requirePermission('users.read'), ctrl.listUsers);
router.post('/', requirePermission('users.create'), ctrl.createUser);
router.put('/:id', requirePermission('users.update'), ctrl.updateUser);
router.post('/:id/disable', requirePermission('users.disable'), ctrl.disableUser);

module.exports = router;
