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

async function listItemComments({ itemId, limit, offset }) {
    const [count, comments] = await prisma.$transaction([
      prisma.itemComment.count({ where: { itemId } }),
      prisma.itemComment.findMany({
        where: { itemId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    ]);
  
    return { comments, count };
  }

module.exports = { ensureItemExists, createItemComment, listItemComments };
