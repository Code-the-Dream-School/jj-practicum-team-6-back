const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

// Custom middlewares
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Routers
const mainRouter = require('./routes/mainRouter.js');

// Core middlewares 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestId);
app.use(logger('dev'));

// Root (HTML)
app.get('/', (_req, res) =>
  res.type('html').send('<h1>Welcome to Retrieve App</h1>')
);

// Health (JSON for monitoring)
app.get('/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok' },
    meta: { requestId: req.id },
  });
});

// Static 
app.use(express.static('public'));
app.use(favicon(path.resolve(__dirname, '..', 'public', 'favicon.ico')));

// API v1
app.use('/api/v1', mainRouter);

// Final handlers
app.use(notFound);     // 404 when no routes matched
app.use(errorHandler); // centralized error formatter

module.exports = app;
