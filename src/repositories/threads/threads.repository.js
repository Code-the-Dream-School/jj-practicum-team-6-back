const { prisma } = require('../../utils/prisma');

// Create or fetch 1:1 thread by itemId + participantId
async function getOrCreateThread({ itemId, ownerId, participantId }) {
  try {
    // Try to find existing thread
    const existing = await prisma.thread.findUnique({
      where: { itemId_participantId: { itemId, participantId } },
    });
    if (existing) return { thread: existing, created: false };

    // Otherwise create new
    const thread = await prisma.thread.create({
      data: {
        itemId,
        ownerId,
        participantId,
      },
    });
    return { thread, created: true };
  } catch (err) {
    // Handle unique violation (race condition)
    if (err.code === 'P2002') {
      const thread = await prisma.thread.findUnique({
        where: { itemId_participantId: { itemId, participantId } },
      });
      return { thread, created: false };
    }
    throw err;
  }
}

// List threads for a user, optional filter by itemId
async function listThreadsForUser(userId, { itemId, page = 1, size = 20 }) {
  const skip = (page - 1) * size;
  const take = size;

  const where = itemId
    ? {
        itemId,
        OR: [{ ownerId: userId }, { participantId: userId }],
      }
    : {
        OR: [{ ownerId: userId }, { participantId: userId }],
      };

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.thread.count({ where }),
  ]);

  return { threads, total, page, size };
}

module.exports = {
  getOrCreateThread,
  listThreadsForUser,
};
