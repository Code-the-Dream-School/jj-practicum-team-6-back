// src/repositories/items/items.repository.js
const { prisma } = require('../../utils/prisma');

const includeRelations = {
  owner: {
    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
  },
  category: { select: { name: true } },
};

function buildInclude({ includePhotos, photosOrder, includeCounts = true } = {}) {
  const base = { ...includeRelations };
  if (includePhotos) {
    base.photos = {
      select: { id: true, url: true, createdAt: true },
      orderBy: { createdAt: photosOrder === 'desc' ? 'desc' : 'asc' },
    };
  }
  if (includeCounts) {
    base._count = {
      select: {
        seenMarks: true,
        comments: true,
      },
    };
  }
  return base;
}

function attachCounts(entity) {
  if (!entity) return entity;
  const { _count, ...rest } = entity;
  return {
    ...rest,
    seenCount: _count?.seenMarks ?? 0,
    commentsCount: _count?.comments ?? 0,
  };
}

function attachCountsMany(arr) {
  return Array.isArray(arr) ? arr.map(attachCounts) : arr;
}

async function findMany({
  filters,
  pagination,
  includePhotos = false,
  photosOrder = 'asc',
}) {
  const {
    status,
    category,
    isResolved,
    geo,
    q,
    zipCodeExact,
    ownerId,
  } = filters || {};
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const include = buildInclude({ includePhotos, photosOrder });

  if (!geo) {
    const whereAND = [];

    if (status) whereAND.push({ status });
    if (typeof isResolved === 'boolean') whereAND.push({ isResolved });
    if (category) whereAND.push({ categoryName: category });
    if (zipCodeExact) whereAND.push({ zipCode: zipCodeExact });
    if (ownerId) whereAND.push({ ownerId });

    if (q && q.trim().length > 0) {
      whereAND.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where = whereAND.length ? { AND: whereAND } : {};

    const [itemsRaw, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateReported: 'desc' },
        include,
      }),
      prisma.item.count({ where }),
    ]);

    const items = attachCountsMany(itemsRaw);
    return { items, total };
  }

  const lat = Number(geo.lat);
  const lng = Number(geo.lng);
  const radius = Number(geo.radius);

  const conditions = ["latitude IS NOT NULL", "longitude IS NOT NULL"];
  if (status) conditions.push(`status = '${status}'`);
  if (typeof isResolved === 'boolean') conditions.push(`is_resolved = ${isResolved}`);
  if (category) conditions.push(`category_name = '${category}'`);
  if (zipCodeExact) conditions.push(`zip_code = '${zipCodeExact}'`);
  if (ownerId) conditions.push(`owner_id = '${ownerId}'`);
  if (q && q.trim().length > 0) {
    conditions.push(`(title ILIKE '%${q}%' OR description ILIKE '%${q}%')`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const idsRows = await prisma.$queryRawUnsafe(`
    WITH base AS (
      SELECT
        id,
        date_reported,
        latitude,
        longitude,
        (3959 * acos(
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        )) AS distance_miles
      FROM items
      ${whereClause}
    ),
    within AS (
      SELECT id, distance_miles, date_reported
      FROM base
      WHERE distance_miles <= ${radius}
      ORDER BY distance_miles ASC, date_reported DESC
      OFFSET ${skip} LIMIT ${limit}
    )
    SELECT id FROM within;
  `);

  const totalRows = await prisma.$queryRawUnsafe(`
    WITH base AS (
      SELECT
        id,
        (3959 * acos(
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        )) AS distance_miles
      FROM items
      ${whereClause}
    )
    SELECT COUNT(*)::int AS count
    FROM base
    WHERE distance_miles <= ${radius};
  `);

  const ids = idsRows.map((r) => r.id);
  const total = totalRows[0]?.count || 0;

  if (ids.length === 0) return { items: [], total };

  const itemsUnordered = await prisma.item.findMany({
    where: { id: { in: ids } },
    include,
  });

  const orderMap = new Map(ids.map((id, i) => [id, i]));
  const itemsOrdered = itemsUnordered.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));

  const items = attachCountsMany(itemsOrdered);
  return { items, total };
}

async function findById(
  id,
  options = { includePhotos: false, photosOrder: 'asc' }
) {
  const include = buildInclude(options);
  const item = await prisma.item.findUnique({
    where: { id },
    include,
  });
  return attachCounts(item);
}

async function create(data, ownerId) {
  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      zipCode: data.zipCode ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      isResolved:
        typeof data.isResolved === 'boolean' ? data.isResolved : data.status === 'RESOLVED',
      owner: { connect: { id: ownerId } },
      category: { connect: { name: data.categoryName } },
    },
    include: buildInclude({ includePhotos: true, photosOrder: 'asc' }),
  });
  return attachCounts(created);
}

async function findByOwner(ownerId, { page, limit }) {
  const skip = (page - 1) * limit;

  const [itemsRaw, total] = await Promise.all([
    prisma.item.findMany({
      where: { ownerId },
      skip,
      take: limit,
      orderBy: { dateReported: 'desc' },
      include: buildInclude({ includePhotos: true, photosOrder: 'asc' }),
    }),
    prisma.item.count({ where: { ownerId } }),
  ]);

  const items = attachCountsMany(itemsRaw);
  return { items, total };
}

async function updateByOwner(id, ownerId, data) {
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
  if (data.categoryName !== undefined) patch.categoryName = data.categoryName;

  if (data.status === 'RESOLVED' && data.isResolved === undefined) {
    patch.isResolved = true;
  }

  const updated = await prisma.item.update({
    where: { id },
    data: patch,
    include: buildInclude({ includePhotos: true, photosOrder: 'asc' }),
  });

  return attachCounts(updated);
}

async function deleteByOwner(id, ownerId) {
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
