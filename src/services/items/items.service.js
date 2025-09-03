const itemsRepo = require('../../repositories/items/items.repository');

async function getItems(filters, pagination) {
  return itemsRepo.findMany({ filters, pagination });
}

async function getItemById(id) {
  return itemsRepo.findById(id);
}

async function createItem(data, ownerId) {
  return itemsRepo.create(data, ownerId);
}

async function getSelfItems(ownerId, pagination) {
  return itemsRepo.findByOwner(ownerId, pagination);
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  getSelfItems,
};
