const { StatusCodes } = require('http-status-codes');
const itemsService = require('../../services/items/items.service');
const createItemSchema = require('../../validators/items/createItem.schema');
const updateStatusSchema = require('../../validators/items/updateStatus.schema');
const MAX_PHOTOS_PER_ITEM = parseInt(process.env.MAX_PHOTOS_PER_ITEM || '6', 10);

// GET /items
async function getItems(req, res, next) {
  try {
    // read validated pagination/sort from middleware
    const q = req.validatedQuery || {};
    const { items, total } = await itemsService.getItems(
      {
        sortBy: q.sortBy,
        sortOrder: q.sortOrder,
      },
      { page: q.page, limit: q.limit, offset: q.offset }
    );

    return res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: q.page,
        limit: q.limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /items/:id
async function getItemById(req, res, next) {
  try {
    const id = (req.validatedParams && req.validatedParams.id) || req.params.id;
    const item = await itemsService.getItemById(id);
    if (!item) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
        meta: { requestId: req.id },
      });
    }
    return res.json({ success: true, data: item, meta: { requestId: req.id } });
  } catch (err) {
    next(err);
  }
}

// POST /items (auth required)
async function createItem(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        meta: { requestId: req.id },
      });
    }

    const dto = createItemSchema.parse(req.body);
    const created = await itemsService.createItem(dto, userId);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: created,
      meta: { requestId: req.id },
    });
  } catch (err) {
    next(err);
  }
}

// GET /items/self (auth required)
async function getSelfItems(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        meta: { requestId: req.id },
      });
    }

    const q = req.validatedQuery || {};
    const { items, total } = await itemsService.getSelfItems(userId, {
      page: q.page,
      limit: q.limit,
      offset: q.offset,
    });

    return res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: q.page,
        limit: q.limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /items/:id (owner-only)
async function updateItem(req, res, next) {
  try {
    const id = req.params.id;
    const ownerId = req.user.id;
    const data = req.validatedBody || req.body;

    const updated = await itemsService.updateItem(id, ownerId, data);
    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
        meta: { requestId: req.id },
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
      meta: { requestId: req.id },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /items/:id (owner-only)
async function deleteItem(req, res, next) {
  try {
    const id = req.params.id;
    const ownerId = req.user.id;

    const ok = await itemsService.deleteItem(id, ownerId);
    if (!ok) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
        meta: { requestId: req.id },
      });
    }

    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// PATCH /items/:id/status (owner-only)
async function updateItemStatus(req, res, next) {
  try {
    const id = req.params.id;
    const ownerId = req.user.id;
    const { status, isResolved } = updateStatusSchema.parse(req.body);

    const updated = await itemsService.updateItem(id, ownerId, { status, isResolved });
    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
        meta: { requestId: req.id },
      });
    }
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated,
      meta: { requestId: req.id },
    });
  } catch (err) {
    next(err);
  }
}

async function addItemPhotos(req, res, next) {
  try {
    const itemId = req.params.id;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        meta: { requestId: req.id },
      });
    }

    const photos = req.body?.photos;
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'photos must be a non-empty array' },
        meta: { requestId: req.id },
      });
    }
    if (photos.length > MAX_PHOTOS_PER_ITEM) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `Too many photos: max ${MAX_PHOTOS_PER_ITEM}` },
        meta: { requestId: req.id },
      });
    }

    const created = await itemsService.addItemPhotos(itemId, ownerId, photos);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: created,
      meta: { requestId: req.id },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteItemPhoto(req, res, next) {
  try {
    const itemId = req.params.id;
    const photoId = req.params.photoId;
    const ownerId = req.user?.id;

    if (!ownerId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        meta: { requestId: req.id },
      });
    }

    const ok = await itemsService.deleteItemPhoto(itemId, ownerId, photoId);
    if (!ok) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item or photo not found (or not owned)' },
        meta: { requestId: req.id },
      });
    }

    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  getSelfItems,
  updateItem,
  deleteItem,
  updateItemStatus,
  addItemPhotos,
  deleteItemPhoto,
};
