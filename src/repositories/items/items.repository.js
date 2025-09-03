// src/repositories/items/items.repository.js
const { prisma } = require('../../utils/prisma');

const includeRelations = {
  owner: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  // В Category НЕТ поля id — PK это name
  category: { select: { name: true } },
};

async function findMany({ filters, pagination }) {
  const { status, category, isResolved } = filters || {};
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereAND = [];
  if (status) whereAND.push({ status });
  if (typeof isResolved === 'boolean') whereAND.push({ isResolved });
  if (category) whereAND.push({ categoryName: category }); // фильтр по имени категории

  const where = whereAND.length ? { AND: whereAND } : {};

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateReported: 'desc' }, // у тебя это поле есть
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
      // если не передали явно — считаем resolved по статусу
      isResolved:
        typeof data.isResolved === 'boolean'
          ? data.isResolved
          : data.status === 'RESOLVED',
      owner: { connect: { id: ownerId } },
      // ВАЖНО: коннект по name, потому что в схеме PK = name
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

module.exports = {
  findMany,
  findById,
  create,
  findByOwner,
};
