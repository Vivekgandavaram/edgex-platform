const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const env = require('../config/env');

const allowedOrigins = new Set([
  env.appUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
]);

// Real-time delivery for live telemetry, device status, and alerts.
// Clients join a room per device they're authorized to view; the write
// controller emits into `device:<id>` whenever new readings land.
function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired session'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('subscribe:device', (deviceMongoId) => {
      socket.join(`device:${deviceMongoId}`);
    });
    socket.on('unsubscribe:device', (deviceMongoId) => {
      socket.leave(`device:${deviceMongoId}`);
    });
  });

  return io;
}

module.exports = initSockets;
