const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.get('/', requireAuth, requirePermission('audit.read'), ctrl.listAuditLogs);

module.exports = router;
