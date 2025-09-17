const { prisma } = require('../../utils/prisma');
const { getOrCreateThread, listThreadsForUser, markThreadAsRead, countUnreadForUser } = require('../../repositories/threads/threads.repository');

// POST /api/v1/threads
async function postThread(req, res, next) {
  try {
    const { itemId, participantId } = req.body;

    // Load item and owner
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, ownerId: true },
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' },
      });
    }

    // Authorization: only item owner or participant themselves
    if (req.user.id !== item.ownerId && req.user.id !== participantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not allowed to create thread' },
      });
    }

    const { thread, created } = await getOrCreateThread({
      itemId,
      ownerId: item.ownerId,
      participantId,
    });

    // Enrich with computed helpers for the client
    const me = req.user.id;
    const payload = {
      ...thread,
      // expose conversation partner as "otherUser"
      otherUser: thread.ownerId === me ? thread.participant : thread.owner,
      // convenience field for item thumbnail
      item: {
        ...thread.item,
        primaryPhotoUrl:
          Array.isArray(thread.item?.photos) && thread.item.photos.length
            ? thread.item.photos[0].url
            : null,
      },
    };

    return res.status(created ? 201 : 200).json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/threads
async function getThreads(req, res, next) {
  try {
    const { itemId, page = 1, size = 20 } = req.query;

    // Optional strict check for itemId: only owner or existing participant can view
    if (itemId) {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { ownerId: true },
      });
      if (!item) {
        return res.status(404).json({
          success: false,
          error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' },
        });
      }
      if (req.user.id !== item.ownerId) {
        const membership = await prisma.thread.count({
          where: { itemId, participantId: req.user.id },
        });
        if (membership === 0) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Not allowed to view threads for this item' },
          });
        }
      }
    }

    const { threads, total } = await listThreadsForUser(req.user.id, {
      itemId,
      page: Number(page) || 1,
      size: Number(size) || 20,
    });

    // Add computed fields for convenience on the client (no breaking changes)
    const me = req.user.id;
    const enriched = threads.map(t => ({
      ...t,
      otherUser: t.ownerId === me ? t.participant : t.owner,
      item: {
        ...t.item,
        primaryPhotoUrl:
          Array.isArray(t.item?.photos) && t.item.photos.length ? t.item.photos[0].url : null,
      },
    }));

    const meta = {
      page: Number(page) || 1,
      size: Number(size) || 20,
      total,
      pages: Math.ceil(total / (Number(size) || 20)),
    };

    return res.status(200).json({ success: true, data: enriched, meta });
  } catch (err) {
    next(err);
  }
}

// POST /threads/:threadId/read
async function markThreadRead(req, res, next) {
  try {
    const { threadId } = req.params;
    const { messageId } = req.body;
    const userId = req.user.id;

    const updated = await markThreadAsRead(threadId, userId, messageId);

    if (updated === 'forbidden') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not allowed to mark this thread' },
      });
    }

    res.status(200).json({
      success: true,
      thread: updated,
      data: updated
    });
  } catch (err) {
    // Prisma UUID error
    if (err.code === 'P2023') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_UUID', message: 'ThreadId or MessageId is invalid' },
      });
    }

    if (err.message === 'Thread not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'THREAD_NOT_FOUND', message: 'Thread does not exist' },
      });
    }

    next(err);
  }
}

// GET /threads/unread-count
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const count = await countUnreadForUser(userId);
    res.status(200).json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postThread,
  getThreads,
  markThreadRead,
  getUnreadCount,
};
