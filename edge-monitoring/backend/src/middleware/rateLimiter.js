const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (max, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message } },
  });

exports.loginLimiter = make(env.rateLimits.login, 15, 'Too many login attempts. Try again shortly.');
exports.otpLimiter = make(env.rateLimits.otp, 15, 'Too many OTP requests. Try again shortly.');
exports.passwordResetLimiter = make(5, 15, 'Too many password reset requests. Try again shortly.');
exports.writeApiLimiter = make(env.rateLimits.write, 1, 'Ingestion rate limit exceeded for this device.');
