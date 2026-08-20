const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  if (!env.mongodbUri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env and configure it.');
    process.exit(1);
  }
  try {
    await mongoose.connect(env.mongodbUri);
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
