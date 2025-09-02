const path = require('path');
const env = require('./config/env');
const express = require('express');
const app = express();
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');
const { prisma } = require('./utils/prisma');

// Custom middlewares
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Routers
const mainRouter = require('./routes/mainRouter.js');

// CORS (read values from centralized env)
const allowedOrigins = env.cors.origins; // array from CORS_ORIGINS

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins || allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: env.cors.credentials,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));


// Core middlewares 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestId);
app.use(logger('dev'));

// Health (JSON for monitoring)
app.get('/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok' },
    meta: { requestId: req.id },
  });
});

app.get('/healthz/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      data: { db: true },
      meta: { requestId: req.id },
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DB_UNAVAILABLE',
        message: e?.message || 'Postgres unreachable',
      },
      meta: { requestId: req.id },
    });
  }
});


// Static 
app.use(express.static(path.resolve(__dirname, '..', 'public')));
app.use(favicon(path.resolve(__dirname, '..', 'public', 'favicon.ico')));

// API v1
app.use('/api/v1', mainRouter);

// Final handlers
app.use(notFound);     // 404 when no routes matched
app.use(errorHandler); // centralized error formatter

module.exports = app;
