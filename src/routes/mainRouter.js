const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController.js');
const { prisma } = require('../utils/prisma');

const authRouter = require('./auth/auth.router');
const categoriesRouter = require('./categories/categories.router.js');
const itemsRouter = require('./items/items.router.js');
const uploadsRouter = require('./uploads/uploads.router.js');
const commentsRouter = require('./comments/comments.router.js');
const usersRouter = require('./users/users.routes.js');
const threadsRouter = require('./threads/threads.router.js'); // ← new

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

// Modules
router.use('/auth', authRouter);
router.use('/categories', categoriesRouter);
router.use('/items', itemsRouter);
router.use('/comments', commentsRouter);
router.use('/uploads', uploadsRouter);
router.use('/users', usersRouter);
router.use('/threads', threadsRouter); 

module.exports = router;
