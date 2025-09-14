const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { postThread, getThreads, markThreadRead } = require('../../controllers/threads/threads.controller');
const { createThreadBodySchema, listThreadsQuerySchema, markThreadReadBodySchema } = require('../../validators/threads/threads.schema');
const messagesRouter = require('../messages/messages.router');

// Protect nested routes too
router.use('/:threadId/messages', requireAuth, messagesRouter);

// POST /api/v1/threads
router.post(
  '/',
  requireAuth,
  validate({ body: createThreadBodySchema }),
  postThread
);

// GET /api/v1/threads
router.get(
  '/',
  requireAuth,
  validate({ query: listThreadsQuerySchema }),
  getThreads
);

// POST /api/v1/threads/:threadId/read
router.post(
  '/:threadId/read',
  requireAuth,
  validate({ body: markThreadReadBodySchema }),
  markThreadRead
);

module.exports = router;
