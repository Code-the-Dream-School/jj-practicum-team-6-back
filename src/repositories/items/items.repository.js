const { prisma } = require('../../utils/prisma');

const includeRelations = {
  owner: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  category: { select: { name: true } },
};

async function findMany({ filters, pagination }) {
  const { status, category, isResolved, geo, q, zipCodeExact } = filters || {};
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // NO GEO branch 
  if (!geo) {
    const whereAND = [];

    // Add filters dynamically only if values are provided
    if (status) whereAND.push({ status });
    if (typeof isResolved === 'boolean') whereAND.push({ isResolved });
    if (category) whereAND.push({ categoryName: category });
    if (zipCodeExact) whereAND.push({ zipCode: zipCodeExact });

    // Text search across title and description
    if (q && q.trim().length > 0) {
      whereAND.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

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

  // GEO branch 
  const lat = Number(geo.lat);
  const lng = Number(geo.lng);
  const radius = Number(geo.radius);

  // Build WHERE conditions dynamically
  const conditions = ["latitude IS NOT NULL", "longitude IS NOT NULL"];

  if (status) {
    conditions.push(`status = '${status}'`);
  }
  if (typeof isResolved === 'boolean') {
    conditions.push(`is_resolved = ${isResolved}`);
  }
  if (category) {
    conditions.push(`category_name = '${category}'`);
  }
  if (zipCodeExact) {
    conditions.push(`zip_code = '${zipCodeExact}'`);
  }
  if (q && q.trim().length > 0) {
    conditions.push(`(title ILIKE '%${q}%' OR description ILIKE '%${q}%')`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // get matching item IDs ordered by distance
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

  // Count total number of matches
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

  // Load full records and keep the order by distance
  const itemsUnordered = await prisma.item.findMany({
    where: { id: { in: ids } },
    include: includeRelations,
  });

  const orderMap = new Map(ids.map((id, i) => [id, i]));
  const items = itemsUnordered.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));

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
        typeof data.isResolved === 'boolean' ? data.isResolved : data.status === 'RESOLVED',
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

async function updateByOwner(id, ownerId, data) {
  // Ownership check
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

  // Build patch object dynamically
  const patch = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.status !== undefined) patch.status = data.status;
  if (data.zipCode !== undefined) patch.zipCode = data.zipCode;
  if (data.latitude !== undefined) patch.latitude = data.latitude;
  if (data.longitude !== undefined) patch.longitude = data.longitude;
  if (data.isResolved !== undefined) patch.isResolved = data.isResolved;
  if (data.categoryName !== undefined) patch.categoryName = data.categoryName;

  // if status = RESOLVED, also set isResolved = true
  if (data.status === 'RESOLVED' && data.isResolved === undefined) {
    patch.isResolved = true;
  }

  return prisma.item.update({
    where: { id },
    data: patch,
    include: includeRelations,
  });
}

async function deleteByOwner(id, ownerId) {
  // Ownership check
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

  // Cascade delete related records
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
