const { prisma } = require('../../utils/prisma');

async function findAllSorted() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

async function findByName(name) {
  return prisma.category.findUnique({ where: { name } });
}

async function create(data) {
  return prisma.category.create({ data });
}

async function update(name, data) {
  return prisma.category.update({ where: { name }, data });
}

async function remove(name) {
  return prisma.category.delete({ where: { name } });
}

module.exports = {
  findAllSorted,
  findByName,
  create,
  update,
  remove,
};