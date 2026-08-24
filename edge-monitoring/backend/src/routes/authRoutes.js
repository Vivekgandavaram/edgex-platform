const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, otpLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/register', ctrl.register);
router.post('/login', loginLimiter, ctrl.login);
router.post('/google', loginLimiter, ctrl.googleLogin);
router.post('/otp/request', otpLimiter, ctrl.requestOtp);
router.post('/otp/verify', otpLimiter, ctrl.verifyOtpLogin);
router.post('/forgot-password', passwordResetLimiter, ctrl.forgotPassword);
router.post('/reset-password', passwordResetLimiter, ctrl.resetPassword);
router.get('/me', requireAuth, ctrl.me);
router.put('/profile', requireAuth, ctrl.updateProfile);
router.post('/change-password', requireAuth, ctrl.changePassword);
router.post('/logout', ctrl.logout);

module.exports = router;
