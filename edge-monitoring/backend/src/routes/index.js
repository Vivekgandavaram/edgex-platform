const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/devices', require('./deviceRoutes'));
router.use('/sensors', require('./sensorRoutes'));
router.use('/api-keys', require('./apiKeyRoutes'));
router.use('/write', require('./writeRoutes'));   // POST /api/v1/write
router.use('/read', require('./readRoutes'));     // GET  /api/v1/read
router.use('/', require('./alertRoutes'));         // /alerts, /alert-rules
router.use('/users', require('./userRoutes'));
router.use('/admins', require('./adminRoutes'));
router.use('/audit-logs', require('./auditRoutes'));

module.exports = router;
