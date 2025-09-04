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

// Owner-only update
async function updateItem(id, ownerId, data) {
  if (data && data.status === 'RESOLVED' && data.isResolved === undefined) {
    data.isResolved = true;
  }
  return itemsRepo.updateByOwner(id, ownerId, data);
}

// Owner-only delete
async function deleteItem(id, ownerId) {
  return itemsRepo.deleteByOwner(id, ownerId);
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  getSelfItems,
  updateItem,
  deleteItem,
};
