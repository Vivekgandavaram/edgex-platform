const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OtpCode = require('../models/OtpCode');
const PasswordResetToken = require('../models/PasswordResetToken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { hashPassword, comparePassword, isStrongPassword } = require('../utils/password');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp');
const email = require('../services/emailService');
const audit = require('../services/auditService');
const env = require('../config/env');

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

function issueSession(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const isProduction = env.nodeEnv === 'production';
  res.cookie('edgex_refresh', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return accessToken;
}

// The hardcoded platform owner (env.superAdminEmail) is promoted to
// SUPER_ADMIN the moment they authenticate, no matter which method they
// use or whether they registered before this account existed. Idempotent —
// safe to call on every login. From there, the Super Admin assigns roles
// and access to everyone else via Admin Management / User Management.
async function ensureSuperAdmin(user) {
  if (user.email === env.superAdminEmail && (user.role !== 'SUPER_ADMIN' || !user.hasGlobalAccess)) {
    user.role = 'SUPER_ADMIN';
    user.hasGlobalAccess = true;
    user.status = 'ACTIVE';
    user.emailVerified = true;
    await user.save();
  }
  return user;
}

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  permissions: u.permissions,
  avatarUrl: u.avatarUrl,
  emailVerified: u.emailVerified,
  status: u.status,
});

// POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, password } = req.body;
  if (!name || !rawEmail || !password) throw new ApiError(400, 'VALIDATION_ERROR', 'Name, email and password are required.');
  if (!isStrongPassword(password)) {
    throw new ApiError(400, 'WEAK_PASSWORD', 'Password must be 8+ characters with upper, lower and a number.');
  }

  const normalizedEmail = rawEmail.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');

  const passwordHash = await hashPassword(password);
  let user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: 'USER',
    status: 'ACTIVE', // set PENDING + require verification in production
    emailVerified: false,
  });
  user = await ensureSuperAdmin(user);

  const verifyToken = crypto.randomBytes(32).toString('hex');
  // In production, persist a hash of verifyToken with an expiry (same pattern as PasswordResetToken).
  await email.sendVerificationEmail(user.email, `${env.appUrl}/verify-email?token=${verifyToken}`);
  await email.sendWelcomeEmail(user.email, user.name);
  await audit.record({ actor: user, action: 'user.registered', resourceType: 'User', resourceId: user._id.toString() });

  res.status(201).json({ success: true, data: { user: publicUser(user) } });
});

// POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  if (!rawEmail || !password) throw new ApiError(400, 'VALIDATION_ERROR', 'Email and password are required.');

  const user = await User.findOne({ email: rawEmail.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !user.passwordHash) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  if (user.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account is not active.');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');

  user.lastLoginAt = new Date();
  await user.save();
  await ensureSuperAdmin(user);
  await audit.record({ actor: user, action: 'user.login', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });

  const accessToken = issueSession(res, user);
  res.json({ success: true, data: { user: publicUser(user), accessToken } });
});

// POST /api/v1/auth/google
exports.googleLogin = asyncHandler(async (req, res) => {
  if (!googleClient) throw new ApiError(501, 'NOT_CONFIGURED', 'Google sign-in is not configured on this server.');

  const { idToken } = req.body;
  if (!idToken) throw new ApiError(400, 'VALIDATION_ERROR', 'idToken is required.');

  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new ApiError(401, 'INVALID_TOKEN', 'Could not verify Google identity.');

  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] });
  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email.toLowerCase(),
      googleId: payload.sub,
      avatarUrl: payload.picture,
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: !!payload.email_verified,
    });
    await email.sendWelcomeEmail(user.email, user.name);
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }

  user.lastLoginAt = new Date();
  await user.save();
  await ensureSuperAdmin(user);
  await audit.record({ actor: user, action: 'user.login_google', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });

  const accessToken = issueSession(res, user);
  res.json({ success: true, data: { user: publicUser(user), accessToken } });
});

// POST /api/v1/auth/otp/request
exports.requestOtp = asyncHandler(async (req, res) => {
  const { email: rawEmail } = req.body;
  if (!rawEmail) throw new ApiError(400, 'VALIDATION_ERROR', 'Email is required.');
  const normalizedEmail = rawEmail.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  // Do not reveal whether the account exists.
  if (user && user.status === 'ACTIVE') {
    const code = generateOtp();
    const codeHash = await hashOtp(code);
    await OtpCode.create({
      email: normalizedEmail,
      codeHash,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await email.sendOtpEmail(normalizedEmail, code);
  }

  res.json({ success: true, data: { message: 'If an account exists, a code has been sent.' } });
});

// POST /api/v1/auth/otp/verify
exports.verifyOtpLogin = asyncHandler(async (req, res) => {
  const { email: rawEmail, code } = req.body;
  if (!rawEmail || !code) throw new ApiError(400, 'VALIDATION_ERROR', 'Email and code are required.');
  const normalizedEmail = rawEmail.toLowerCase().trim();

  const otp = await OtpCode.findOne({ email: normalizedEmail, purpose: 'LOGIN', consumedAt: null }).sort({ createdAt: -1 });
  if (!otp) throw new ApiError(400, 'OTP_INVALID', 'No active code for this email. Request a new one.');
  if (otp.expiresAt < new Date()) throw new ApiError(400, 'OTP_EXPIRED', 'This code has expired. Request a new one.');
  if (otp.attempts >= 5) throw new ApiError(429, 'OTP_LOCKED', 'Too many incorrect attempts. Request a new code.');

  const valid = await verifyOtp(code, otp.codeHash);
  if (!valid) {
    otp.attempts += 1;
    await otp.save();
    throw new ApiError(400, 'OTP_INCORRECT', 'Incorrect code.');
  }

  otp.consumedAt = new Date();
  await otp.save();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || user.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account is not active.');

  user.lastLoginAt = new Date();
  user.emailVerified = true;
  await user.save();
  await ensureSuperAdmin(user);
  await audit.record({ actor: user, action: 'user.login_otp', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });

  const accessToken = issueSession(res, user);
  res.json({ success: true, data: { user: publicUser(user), accessToken } });
});

// POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email: rawEmail } = req.body;
  if (!rawEmail) throw new ApiError(400, 'VALIDATION_ERROR', 'Email is required.');
  const normalizedEmail = rawEmail.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    await email.sendPasswordResetEmail(normalizedEmail, `${env.appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`);
  }

  res.json({ success: true, data: { message: 'If an account exists, a reset link has been sent.' } });
});

// POST /api/v1/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email: rawEmail, token, password } = req.body;
  if (!rawEmail || !token || !password) throw new ApiError(400, 'VALIDATION_ERROR', 'Email, token and new password are required.');
  if (!isStrongPassword(password)) throw new ApiError(400, 'WEAK_PASSWORD', 'Password must be 8+ characters with upper, lower and a number.');

  const user = await User.findOne({ email: rawEmail.toLowerCase().trim() });
  if (!user) throw new ApiError(400, 'INVALID_TOKEN', 'This reset link is invalid or has expired.');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await PasswordResetToken.findOne({ userId: user._id, tokenHash, usedAt: null });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new ApiError(400, 'INVALID_TOKEN', 'This reset link is invalid or has expired.');
  }

  user.passwordHash = await hashPassword(password);
  await user.save();
  resetToken.usedAt = new Date();
  await resetToken.save();

  await email.sendPasswordChangedEmail(user.email);
  await audit.record({ actor: user, action: 'user.password_reset', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });

  res.json({ success: true, data: { message: 'Password updated. You can now log in.' } });
});

// GET /api/v1/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

// PUT /api/v1/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Name is required.');
  req.user.name = name.trim();
  await req.user.save();
  await audit.record({ actor: req.user, action: 'user.profile_updated', resourceType: 'User', resourceId: req.user._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

// POST /api/v1/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'VALIDATION_ERROR', 'Current and new passwords are required.');
  if (!isStrongPassword(newPassword)) throw new ApiError(400, 'WEAK_PASSWORD', 'Password must be 8+ characters with upper, lower and a number.');
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user.passwordHash || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_PASSWORD', 'Current password is incorrect.');
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await audit.record({ actor: user, action: 'user.password_changed', resourceType: 'User', resourceId: user._id.toString(), ipAddress: req.ip });
  res.json({ success: true, data: { message: 'Password updated.' } });
});

// POST /api/v1/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('edgex_refresh');
  res.json({ success: true, data: { message: 'Logged out.' } });
});
