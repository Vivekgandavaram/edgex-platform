const router = require('express').Router();
const ctrl = require('../controllers/apiKeyController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.use(requireAuth);
router.get('/', requirePermission('api.read'), ctrl.listApiKeys);
router.post('/', requirePermission('api.create'), ctrl.createApiKey);
router.post('/:id/rotate', requirePermission('api.rotate'), ctrl.rotateApiKey);
router.post('/:id/revoke', requirePermission('api.revoke'), ctrl.revokeApiKey);

module.exports = router;
