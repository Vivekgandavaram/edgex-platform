const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

exports.hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
exports.comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// Minimum bar: 8+ chars, upper, lower, number. Enforce on both client and server.
exports.isStrongPassword = (pw) =>
  typeof pw === 'string' &&
  pw.length >= 8 &&
  /[A-Z]/.test(pw) &&
  /[a-z]/.test(pw) &&
  /[0-9]/.test(pw);
