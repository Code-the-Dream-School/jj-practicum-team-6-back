const itemsRepo = require('../../repositories/items/items.repository');
const photosRepo = require('../../repositories/photos/photos.repository');

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

// Attach photos to item (owner-only)
async function addItemPhotos(itemId, ownerId, photos) {
  const item = await itemsRepo.findById(itemId);
  const itemOwnerId = item?.ownerId ?? item?.userId;
  if (!item || itemOwnerId !== ownerId) {
    return null;
  }

  return photosRepo.addPhotos(itemId, photos);
}

// Delete photo (owner-only)
async function deleteItemPhoto(itemId, ownerId, photoId) {
  const item = await itemsRepo.findById(itemId);
  const itemOwnerId = item?.ownerId ?? item?.userId;
  if (!item || itemOwnerId !== ownerId) return false;

  return photosRepo.deletePhoto(itemId, photoId);
}


module.exports = {
  getItems,
  getItemById,
  createItem,
  getSelfItems,
  updateItem,
  deleteItem,
  addItemPhotos,
  deleteItemPhoto,
};
