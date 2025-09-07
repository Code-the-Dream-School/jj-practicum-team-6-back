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

module.exports = { ensureItemExists, createSeenMark };
