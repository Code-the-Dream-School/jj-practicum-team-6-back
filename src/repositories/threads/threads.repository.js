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
    if (err.code === 'P2002') {
      const thread = await prisma.thread.findUnique({
        where: { itemId_participantId: { itemId, participantId } },
      });
      return { thread, created: false };
    }
    throw err;
  }
}

// List threads for a user
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
      include: {
        item: {
          select: { id: true, title: true, status: true },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        participant: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    }),
    prisma.thread.count({ where }),
  ]);

  // Map to include `otherUser`
  const mapped = threads.map((t) => {
    const otherUser =
      t.ownerId === userId ? t.participant : t.owner;

    return {
      ...t,
      item: t.item,
      otherUser,
    };
  });

  return { threads: mapped, total, page, size };
}

// Mark thread messages as read up to a messageId
async function markThreadAsRead(threadId, userId, messageId) {
  try {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error('Thread not found');

    // Only participants (owner or participant) can mark reads
    let updateData = {};
    if (thread.ownerId === userId) {
      updateData = {
        ownerLastReadMessageId: messageId,
        ownerLastReadAt: new Date(),
      };
    } else if (thread.participantId === userId) {
      updateData = {
        participantLastReadMessageId: messageId,
        participantLastReadAt: new Date(),
      };
    } else {
      // Not authorized
      return 'forbidden';
    }

    return prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    });
  } catch (err) {
    console.error('Error in markThreadAsRead:', err);
    throw err; // let controller handle it
  }
}

// Count unread messages
async function countUnreadForUser(userId) {
  // Fetch threads where the user participates
  const threads = await prisma.thread.findMany({
    where: {
      OR: [{ ownerId: userId }, { participantId: userId }],
    },
    include: { messages: true },
  });

  let totalUnread = 0;

  for (const t of threads) {
    if (t.ownerId === userId) {
      const lastReadAt = t.ownerLastReadAt || new Date(0);
      totalUnread += t.messages.filter(
        (m) => m.createdAt > lastReadAt && m.senderId !== userId
      ).length;
    } else if (t.participantId === userId) {
      const lastReadAt = t.participantLastReadAt || new Date(0);
      totalUnread += t.messages.filter(
        (m) => m.createdAt > lastReadAt && m.senderId !== userId
      ).length;
    }
  }

  return totalUnread;
}

module.exports = {
  getOrCreateThread,
  listThreadsForUser,
  markThreadAsRead,
  countUnreadForUser,
};
