const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.generateOtp = () => String(crypto.randomInt(100000, 999999));
exports.hashOtp = (code) => bcrypt.hash(code, 10);
exports.verifyOtp = (code, hash) => bcrypt.compare(code, hash);
