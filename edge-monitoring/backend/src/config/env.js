require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',

  mongodbUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,

  email: {
    host: process.env.EMAIL_HOST || 'smtp.resend.com',
    port: Number(process.env.EMAIL_PORT || 587),
    user: process.env.EMAIL_USER || 'resend',
    pass: process.env.EMAIL_PASS || process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || process.env.RESEND_FROM || 'EdgeX <support@vigotech.in>',
  },

  rateLimits: {
    login: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10),
    otp: Number(process.env.RATE_LIMIT_OTP_MAX || 5),
    write: Number(process.env.RATE_LIMIT_WRITE_MAX || 120),
  },

  // The one true Super Admin. Whoever signs in with this email — via
  // password, Google, or OTP — is automatically promoted to SUPER_ADMIN
  // with global access, regardless of how they registered. See
  // controllers/authController.js -> ensureSuperAdmin().
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL || 'vivekgopi07@gmail.com').toLowerCase(),

  // Separate from the real super admin above — only used by the local dev
  // seed script (npm run seed) so seeding never collides with the real account.
  seed: {
    demoSuperAdminEmail: process.env.SEED_DEMO_SUPER_ADMIN_EMAIL || 'demo-admin@edgex.vigotech.in',
    demoSuperAdminPassword: process.env.SEED_DEMO_SUPER_ADMIN_PASSWORD || 'ChangeMe123!',
  },
};
