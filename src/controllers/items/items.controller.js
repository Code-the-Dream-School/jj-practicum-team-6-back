const { StatusCodes } = require('http-status-codes');
const itemsService = require('../../services/items/items.service');
const createItemSchema = require('../../validators/items/createItem.schema');
const querySchema = require('../../validators/items/query.schema');
const updateStatusSchema = require('../../validators/items/updateStatus.schema');


// GET /items
async function getItems(req, res, next) {
  try {
    const parsed = querySchema.parse(req.query);
    const { items, total } = await itemsService.getItems(
      {
        status: parsed.status,
        category: parsed.category,
        isResolved: parsed.is_resolved,
      },
      { page: parsed.page, limit: parsed.limit }
    );
    return res.json({
      success: true,
      data: items,
      meta: { total, page: parsed.page, limit: parsed.limit },
    });
  } catch (err) {
    next(err);
  }
}

// GET /items/:id
async function getItemById(req, res, next) {
  try {
    const item = await itemsService.getItemById(req.params.id);
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

    const parsed = querySchema.parse(req.query);
    const { items, total } = await itemsService.getSelfItems(userId, {
      page: parsed.page,
      limit: parsed.limit,
    });
    return res.json({
      success: true,
      data: items,
      meta: { total, page: parsed.page, limit: parsed.limit },
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


module.exports = {
  getItems,
  getItemById,
  createItem,
  getSelfItems,
  updateItem,   
  deleteItem, 
  updateItemStatus,
};
