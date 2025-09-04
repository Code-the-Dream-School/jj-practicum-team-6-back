const express = require('express');
const router = express.Router();

const itemsController = require('../../controllers/items/items.controller');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');

const updateItemSchema = require('../../validators/items/updateItem.schema');
const idParamSchema = require('../../validators/items/idParam.schema');

// GET /items
router.get('/', itemsController.getItems);

// GET /items/self (auth required)
router.get('/self', requireAuth, itemsController.getSelfItems);

// GET /items/:id
router.get('/:id', itemsController.getItemById);

// POST /items (auth required)
router.post('/', requireAuth, itemsController.createItem);

// PATCH /items/:id (owner-only)
router.patch(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema, body: updateItemSchema }),
  itemsController.updateItem
);

// DELETE /items/:id (owner-only)
router.delete('/:id', requireAuth, validate({ params: idParamSchema }), itemsController.deleteItem);

module.exports = router;
