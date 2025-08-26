// src/app.js
const express = require('express');
const app = express();
const cors = require('cors');
const favicon = require('express-favicon');
const logger = require('morgan');

const mainRouter = require('./routes/mainRouter.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));

// Health endpoints (before static)
app.get('/', (_req, res) => res.status(200).send('Retrieve API v1'));
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));

// Static (after health so "/" isn’t intercepted)
app.use(express.static('public'));
app.use(favicon(__dirname + '/public/favicon.ico'));

// API
app.use('/api/v1', mainRouter);
app.get('/', (req, res) => {
  res.send('<h1>Welcome to Retriev App</h1> ');
});

module.exports = app;
