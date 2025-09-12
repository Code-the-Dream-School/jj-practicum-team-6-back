const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Ensure that the given user is a participant of the thread.
 * Returns the thread object if valid.
 * Throws error with status/code if not allowed.
 */
async function assertUserInThread(threadId, userId) {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, ownerId: true, participantId: true },
  });

  if (!thread) {
    const err = new Error('Thread not found');
    err.status = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const isParticipant =
    thread.ownerId === userId || thread.participantId === userId;

  if (!isParticipant) {
    const err = new Error('You are not a participant of this thread');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  return thread;
}

/**
 * Create a new message inside a thread.
 * @param {string} threadId
 * @param {string} senderId
 * @param {{ body: string, attachmentUrl?: string|null }} payload
 * @returns {Promise<object>} created message
 */
async function createMessage(threadId, senderId, payload) {
  const { body, attachmentUrl = null } = payload || {};

  // 1) Ensure user is participant
  await assertUserInThread(threadId, senderId);

  // 2) Basic validation (deep validation should be done with Zod in controller)
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    const err = new Error('Message body is required');
    err.status = 422;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // 3) Create message
  const created = await prisma.message.create({
    data: {
      threadId,
      senderId,
      body: body.trim(),
      attachmentUrl: attachmentUrl || null,
    },
    select: {
      id: true,
      threadId: true,
      senderId: true,
      body: true,
      attachmentUrl: true,
      createdAt: true,
    },
  });

  return created;
}

/**
 * List messages for a thread with limit & before pagination.
 * Order: newest first (createdAt DESC, id DESC).
 *
 * If "before" is provided (messageId):
 *   fetch only messages older than that message.
 *
 * @param {string} threadId
 * @param {string} userId - for participant check
 * @param {{ limit?: number, before?: string }} params
 * @returns {Promise<{ data: object[], meta: { nextBefore: string|null, count: number } }>}
 */
async function listMessages(threadId, userId, params = {}) {
  // 1) Ensure user is participant
  await assertUserInThread(threadId, userId);

  // 2) Normalize limit
  const rawLimit = Number(params.limit) || 20;
  const limit = Math.max(1, Math.min(rawLimit, 50));
  const beforeId = params.before || null;

  // 3) If beforeId is provided, find the boundary message
  let boundary = null;
  if (beforeId) {
    boundary = await prisma.message.findUnique({
      where: { id: beforeId },
      select: { id: true, createdAt: true, threadId: true },
    });

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

  // 4) Build filter condition for messages older than boundary
  const where = { threadId };
  if (boundary) {
    where.OR = [
      // strictly older by createdAt
      { createdAt: { lt: boundary.createdAt } },
      // same createdAt, but smaller id
      {
        AND: [
          { createdAt: boundary.createdAt },
          { id: { lt: boundary.id } },
        ],
      },
    ];
  }

  // 5) Fetch one extra to detect "has more"
  const rows = await prisma.message.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    select: {
      id: true,
      threadId: true,
      senderId: true,
      body: true,
      attachmentUrl: true,
      createdAt: true,
    },
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
