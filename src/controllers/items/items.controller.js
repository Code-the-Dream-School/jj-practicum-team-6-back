const itemsService = require('../../services/items/items.service');
const createItemSchema = require('../../validators/items/createItem.schema');
const querySchema = require('../../validators/items/query.schema');

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
    res.json({ success: true, data: items, meta: { total, page: parsed.page, limit: parsed.limit } });
  } catch (err) {
    next(err);
  }
}

async function getItemById(req, res, next) {
  try {
    const item = await itemsService.getItemById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dto = createItemSchema.parse(req.body);
    const created = await itemsService.createItem(dto, userId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

async function getSelfItems(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const parsed = querySchema.parse(req.query);
    const { items, total } = await itemsService.getSelfItems(userId, {
      page: parsed.page,
      limit: parsed.limit,
    });
    res.json({ success: true, data: items, meta: { total, page: parsed.page, limit: parsed.limit } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getItems,
  getItemById,
  createItem,
  getSelfItems,
};
