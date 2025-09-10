// src/services/seen/seen.service.js
const { prisma } = require('../../utils/prisma');

async function ensureItemExists(itemId) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  return Boolean(item);
}

async function createSeenMark({ itemId, userId }) {
  return prisma.seenMark.create({
    data: { itemId, userId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

// returns all users who marked the item as seen, sorted by newest first
async function listSeenMarks(itemId, { limit, offset, sortBy, sortOrder }) {
  const [marks, count] = await Promise.all([
    prisma.seenMark.findMany({
      where: { itemId },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.seenMark.count({ where: { itemId } }),
  ]);

  return { marks, count };
}

// retrieves a seen mark along with the item's owner ID for permission checks
async function getSeenMarkForItem(markId) {
  return prisma.seenMark.findUnique({
    where: { id: markId },
    include: {
      item: { select: { id: true, ownerId: true } },
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

module.exports = {
  ensureItemExists,
  createSeenMark,
  listSeenMarks,
  getSeenMarkForItem
};
