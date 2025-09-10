const axios = require('axios');
const itemsRepo = require('../../repositories/items/items.repository');
const photosRepo = require('../../repositories/photos/photos.repository');

// Real ZIP → coords via Zippopotam.us (no API key)
async function zipToCoords(zip, country = 'us') {
  if (!zip) return null;
  try {
    const url = `https://api.zippopotam.us/${country}/${zip}`;
    const { data } = await axios.get(url, { timeout: 5000 });
    const place = data?.places?.[0];
    if (!place) return null;

    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return { lat, lng };
  } catch (e) {
    // 404 → unknown ZIP; other errors → network/timeouts
    if (e.response && e.response.status === 404) return null;
    throw e;
  }
}

// LIST with optional geo-search (miles)
async function getItems(filters, pagination) {
  let geo = filters.geo;

  // If ZIP is provided, geocode it to coordinates (strict: fail with 400 if not found)
  if (geo && geo.zip) {
    const coords = await zipToCoords(geo.zip, 'us');
    if (!coords) {
      const err = new Error('ZIP code not found');
      err.status = 400;
      err.code = 'ZIP_NOT_FOUND';
      throw err;
    }
    geo = { lat: coords.lat, lng: coords.lng, radius: geo.radius };
  }

  return itemsRepo.findMany({ filters: { ...filters, geo }, pagination });
}

// READ one
async function getItemById(id) {
  return itemsRepo.findById(id);
}

// CREATE: if zipCode is present and latitude/longitude not provided, geocode and fill
async function createItem(data, ownerId) {
  let payload = { ...data };

  const needGeo =
    !!payload.zipCode &&
    (payload.latitude === undefined || payload.longitude === undefined);

  if (needGeo) {
    try {
      const coords = await zipToCoords(payload.zipCode, 'us');
      if (coords) {
        if (payload.latitude === undefined) payload.latitude = coords.lat;
        if (payload.longitude === undefined) payload.longitude = coords.lng;
      }
      // if not found / network issue: keep as is (do not fail create)
    } catch {
      // swallow geocoder errors for create; item can be created without coords
    }
  }

  return itemsRepo.create(payload, ownerId);
}

// LIST self
async function getSelfItems(ownerId, pagination) {
  return itemsRepo.findByOwner(ownerId, pagination);
}

// UPDATE: if zipCode provided AND latitude/longitude not explicitly set, try to geocode
async function updateItem(id, ownerId, data) {
  const patch = { ...data };

  // auto-set isResolved when status becomes RESOLVED and flag not provided (business rule kept)
  if (patch && patch.status === 'RESOLVED' && patch.isResolved === undefined) {
    patch.isResolved = true;
  }

  const zipProvided = typeof patch.zipCode !== 'undefined';
  const latProvided = Object.prototype.hasOwnProperty.call(patch, 'latitude');
  const lngProvided = Object.prototype.hasOwnProperty.call(patch, 'longitude');

  const shouldGeocode = zipProvided && (!latProvided || !lngProvided);

  if (shouldGeocode) {
    try {
      const coords = await zipToCoords(patch.zipCode, 'us');
      if (coords) {
        if (!latProvided) patch.latitude = coords.lat;
        if (!lngProvided) patch.longitude = coords.lng;
      }
      // if not found / network issue: keep patch as is (do not fail update)
    } catch {
      // swallow geocoder errors for update as well
    }
  }

  return itemsRepo.updateByOwner(id, ownerId, patch);
}

// DELETE (owner)
async function deleteItem(id, ownerId) {
  return itemsRepo.deleteByOwner(id, ownerId);
}

// Attach photos (owner)
async function addItemPhotos(itemId, ownerId, photos) {
  const item = await itemsRepo.findById(itemId);
  const itemOwnerId = item?.ownerId ?? item?.userId;
  if (!item || itemOwnerId !== ownerId) return null;
  return photosRepo.addPhotos(itemId, photos);
}

// Delete photo (owner)
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
