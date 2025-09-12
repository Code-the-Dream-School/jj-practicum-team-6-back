const { prisma } = require('../../utils/prisma');

/** Get minimal thread fields used for participant checks */
async function findThreadBasic(threadId) {
  return prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, ownerId: true, participantId: true },
  });
}

/** Get a message used as pagination boundary */
async function findMessageBoundary(messageId) {
  return prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, threadId: true, createdAt: true },
  });
}

/** Insert a new message and return public shape */
async function createMessageRow({ threadId, senderId, body, attachmentUrl = null }) {
  return prisma.message.create({
    data: { threadId, senderId, body, attachmentUrl },
    select: {
      id: true,
      threadId: true,
      senderId: true,
      body: true,
      attachmentUrl: true,
      createdAt: true,
    },
  });
}


async function listMessagesPage({ threadId, take, boundary = null }) {
  const where = { threadId };
  if (boundary) {
    where.OR = [
      { createdAt: { lt: boundary.createdAt } },
      { AND: [{ createdAt: boundary.createdAt }, { id: { lt: boundary.id } }] },
    ];
  }

  return prisma.message.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take,
    select: {
      id: true,
      threadId: true,
      senderId: true,
      body: true,
      attachmentUrl: true,
      createdAt: true,
    },
  });
}

module.exports = {
  findThreadBasic,
  findMessageBoundary,
  createMessageRow,
  listMessagesPage,
};
