const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

exports.signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

exports.verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);
exports.verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
