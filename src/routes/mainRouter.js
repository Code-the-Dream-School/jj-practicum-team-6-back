// src/routes/mainRouter.js
const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController.js');
const { prisma } = require('../utils/prisma');  
const authRouter = require('./auth/auth.router'); 
const categoriesRouter = require('../routes/categories/categories.router.js');

// Root
router.get('/', mainController.get);

// DB health check
router.get('/healthz/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: true });
  } catch (e) {
    console.error('DB ping failed:', e?.message || e);
    res.status(500).json({ ok: false, error: 'DB_UNAVAILABLE' });
  }
});

// Auth module (mounted under /api/v1 by app.js)
router.use('/auth', authRouter);

// categories module: /api/v1/categories
router.use('/categories', categoriesRouter);

module.exports = router;
