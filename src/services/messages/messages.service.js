// src/services/messages/messages.service.js
const {
    findThreadBasic,
    findMessageBoundary,
    createMessageRow,
    listMessagesPage,
  } = require('../../repositories/messages/messages.repository');
  
  /** Ensure that the given user is a participant of the thread. */
  async function assertUserInThread(threadId, userId) {
    const thread = await findThreadBasic(threadId);
  
    if (!thread) {
      const err = new Error('Thread not found');
      err.status = 404;
      err.code = 'RESOURCE_NOT_FOUND';
      throw err;
    }
  
    const isParticipant = thread.ownerId === userId || thread.participantId === userId;
    if (!isParticipant) {
      const err = new Error('You are not a participant of this thread');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
  
    return thread;
  }
  
  /** Create a new message inside a thread. */
  async function createMessage(threadId, senderId, payload) {
    const { body, attachmentUrl = null } = payload || {};
  
    await assertUserInThread(threadId, senderId);
  
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      const err = new Error('Message body is required');
      err.status = 422;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  
    const created = await createMessageRow({
      threadId,
      senderId,
      body: body.trim(),
      attachmentUrl: attachmentUrl || null,
    });
  
    return created;
  }
  
  /**
   * List messages with "limit & before" pagination.
   * Order: newest first (createdAt DESC, id DESC).
   */
  async function listMessages(threadId, userId, params = {}) {
    await assertUserInThread(threadId, userId);
  
    const rawLimit = Number(params.limit) || 20;
    const limit = Math.max(1, Math.min(rawLimit, 50));
    const beforeId = params.before || null;
  
    let boundary = null;
    if (beforeId) {
      boundary = await findMessageBoundary(beforeId);
      if (!boundary) {
        const err = new Error('Before message not found');
        err.status = 400;
        err.code = 'BAD_REQUEST';
        throw err;
      }
      if (boundary.threadId !== threadId) {
        const err = new Error('Before message does not belong to this thread');
        err.status = 400;
        err.code = 'BAD_REQUEST';
        throw err;
      }
    }
  
    // fetch limit + 1 to detect "has more"
    const rows = await listMessagesPage({
      threadId,
      take: limit + 1,
      boundary,
    });
  
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextBefore = hasMore ? data[data.length - 1]?.id || null : null;
  
    return {
      data,
      meta: {
        nextBefore,
        count: data.length,
      },
    };
  }
  
  module.exports = {
    createMessage,
    listMessages,
  };
  