const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');
const initSockets = require('./src/sockets');

const allowedOrigins = new Set([
  env.appUrl,
  'https://edgex.vigotech.in',
  'https://www.edgex.vigotech.in',
  'https://api.edgex.vigotech.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
]);

async function start() {
  await connectDB();

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', env: env.nodeEnv } }));
  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  const httpServer = http.createServer(app);
  const io = initSockets(httpServer);
  app.set('io', io);

  httpServer.listen(env.port, () => {
    console.log(`[edgex-api] listening on http://localhost:${env.port}`);
  });
}

start();
