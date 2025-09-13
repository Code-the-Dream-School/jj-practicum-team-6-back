const { createMessage, listMessages } = require('../../services/messages/messages.service');
const {
  createMessageBodySchema,
  listMessagesQuerySchema,
} = require('../../validators/messages/messages.schema');

// POST /api/v1/threads/:threadId/messages
// Create a new message inside a thread
async function postMessage(req, res, next) {
  try {
    const { threadId } = req.params;
    if (!threadId) {
      const err = new Error('threadId is required');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error('Authentication required');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const payload = createMessageBodySchema.parse(req.body);
    const message = await createMessage(threadId, userId, payload);

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/threads/:threadId/messages?limit=20&before=<messageId>
// List messages with "limit & before" pagination
async function getMessages(req, res, next) {
  try {
    const { threadId } = req.params;
    if (!threadId) {
      const err = new Error('threadId is required');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    const userId = req.user?.id;
    if (!userId) {
      const err = new Error('Authentication required');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const parsed = listMessagesQuerySchema.parse(req.query);
    const { limit, before } = parsed;

    const result = await listMessages(threadId, userId, { limit, before });

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postMessage,
  getMessages,
};
