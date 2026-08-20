const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Raw key format: edgex_live_<40 random hex chars>. Only ever shown once, at creation.
function generateRawKey() {
  const random = crypto.randomBytes(24).toString('hex');
  return `edgex_live_${random}`;
}

function previewOf(rawKey) {
  const last4 = rawKey.slice(-4);
  return `edgex_live_${'•'.repeat(8)}${last4}`;
}

async function hashKey(rawKey) {
  return bcrypt.hash(rawKey, 10);
}

async function verifyKey(rawKey, hash) {
  return bcrypt.compare(rawKey, hash);
}

function nextApiId(sequenceNumber) {
  return `API${String(sequenceNumber).padStart(3, '0')}`;
}

function nextDeviceId(sequenceNumber) {
  return `EDGE-${String(sequenceNumber).padStart(3, '0')}`;
}

module.exports = { generateRawKey, previewOf, hashKey, verifyKey, nextApiId, nextDeviceId };
