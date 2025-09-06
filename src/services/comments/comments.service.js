const { prisma } = require('../../utils/prisma');

async function ensureItemExists(itemId) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  return Boolean(item);
}

async function createItemComment({ itemId, authorId, body }) {
  return prisma.itemComment.create({
    data: { itemId, authorId, body },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
}

module.exports = { ensureItemExists, createItemComment };
