const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

// Authenticates a human user via Bearer JWT. Attaches req.user.
exports.requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN', 'Session expired or invalid. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Account not active.');
  }

  req.user = user;
  next();
});
