const { Router } = require('express');
const { postMessage, getMessages } = require('../../controllers/messages/messages.controller');
const { requireAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const {
  createMessageBodySchema,
  listMessagesQuerySchema,
} = require('../../validators/messages/messages.schema');

const router = Router({ mergeParams: true });

// GET /api/v1/threads/:threadId/messages?limit=20&before=<messageId>
router.get('/', requireAuth, validate({ query: listMessagesQuerySchema }), getMessages);

// POST /api/v1/threads/:threadId/messages
router.post('/', requireAuth, validate({ body: createMessageBodySchema }), postMessage);

module.exports = router;
