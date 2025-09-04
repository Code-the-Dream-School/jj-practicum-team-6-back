const { prisma } = require('../../utils/prisma');

const includeRelations = {
  owner: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  category: { select: { name: true } },
};

async function findMany({ filters, pagination }) {
  const { status, category, isResolved } = filters || {};
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereAND = [];
  if (status) whereAND.push({ status });
  if (typeof isResolved === 'boolean') whereAND.push({ isResolved });
  if (category) whereAND.push({ categoryName: category });

  const where = whereAND.length ? { AND: whereAND } : {};

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateReported: 'desc' }, 
      include: includeRelations,
    }),
    prisma.item.count({ where }),
  ]);

  return { items, total };
}

async function findById(id) {
  return prisma.item.findUnique({
    where: { id },
    include: includeRelations,
  });
}

async function create(data, ownerId) {
  return prisma.item.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      zipCode: data.zipCode ?? null,
      latitude: data.latitude,
      longitude: data.longitude,

      isResolved:
        typeof data.isResolved === 'boolean'
          ? data.isResolved
          : data.status === 'RESOLVED',
      owner: { connect: { id: ownerId } },
      category: { connect: { name: data.categoryName } },
    },
    include: includeRelations,
  });
}

async function findByOwner(ownerId, { page, limit }) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { ownerId },
      skip,
      take: limit,
      orderBy: { dateReported: 'desc' },
      include: includeRelations,
    }),
    prisma.item.count({ where: { ownerId } }),
  ]);

  return { items, total };
}

//Owner-only PATCH /items/:id
async function updateByOwner(id, ownerId, data) {
  // Check ownership
  const found = await prisma.item.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });
  if (!found) return null;
  if (found.ownerId !== ownerId) {
    const err = new Error('Forbidden: not your item');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const patch = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.status !== undefined) patch.status = data.status;
  if (data.zipCode !== undefined) patch.zipCode = data.zipCode;
  if (data.latitude !== undefined) patch.latitude = data.latitude;
  if (data.longitude !== undefined) patch.longitude = data.longitude;
  if (data.isResolved !== undefined) patch.isResolved = data.isResolved;
  if (data.categoryName !== undefined) patch.categoryName = data.categoryName; // FK by name

  // Auto-set isResolved if status becomes RESOLVED and the flag wasn't provided
  if (data.status === 'RESOLVED' && data.isResolved === undefined) {
    patch.isResolved = true;
  }

  const updated = await prisma.item.update({
    where: { id },
    data: patch,
    include: includeRelations,
  });

  return updated;
}

// Owner-only DELETE /items/:id 
async function deleteByOwner(id, ownerId) {
  // Check ownership
  const found = await prisma.item.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });
  if (!found) return null;
  if (found.ownerId !== ownerId) {
    const err = new Error('Forbidden: not your item');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Clean up dependent records and delete the item
  await prisma.$transaction([
    prisma.message.deleteMany({ where: { thread: { itemId: id } } }),
    prisma.thread.deleteMany({ where: { itemId: id } }),
    prisma.itemComment.deleteMany({ where: { itemId: id } }),
    prisma.seenMark.deleteMany({ where: { itemId: id } }),
    prisma.itemPhoto.deleteMany({ where: { itemId: id } }),
    prisma.item.delete({ where: { id } }),
  ]);

  return true;
}

module.exports = {
  findMany,
  findById,
  create,
  findByOwner,
  updateByOwner,
  deleteByOwner,
};
