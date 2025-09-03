const prisma = require('../../utils/prisma');

const includeRelations = {
  owner: { select: { id: true, firstName: true, lastName: true, email: true } },
  category: { select: { id: true, name: true } },
};

function isUUID(value) {
  return typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);
}

async function findMany({ filters, pagination }) {
  const { status, category, isResolved } = filters || {};
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereAND = [];
  if (status) whereAND.push({ status });
  if (typeof isResolved === 'boolean') whereAND.push({ isResolved });
  if (category) {
    if (isUUID(category)) {
      whereAND.push({ categoryId: category });
    } else {
      whereAND.push({ category: { name: { equals: category, mode: 'insensitive' } } });
    }
  }
  const where = whereAND.length ? { AND: whereAND } : {};

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
      isResolved: data.status === 'RESOLVED',
      owner: { connect: { id: ownerId } },
      category: { connect: { id: data.categoryId } },
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
      orderBy: { createdAt: 'desc' },
      include: includeRelations,
    }),
    prisma.item.count({ where: { ownerId } }),
  ]);
  return { items, total };
}

module.exports = {
  findMany,
  findById,
  create,
  findByOwner,
};
