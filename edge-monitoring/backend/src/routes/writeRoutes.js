const router = require('express').Router();
const ctrl = require('../controllers/ingestController');
const { writeApiLimiter } = require('../middleware/rateLimiter');

// No requireAuth here — WRITE access is authenticated via the device API key itself.
router.post('/', writeApiLimiter, ctrl.write);

module.exports = router;
