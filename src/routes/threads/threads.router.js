const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { postThread, getThreads } = require('../../controllers/threads/threads.controller');
const { createThreadBodySchema, listThreadsQuerySchema } = require('../../validators/threads/threads.schema');

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

module.exports = router;
