const express = require('express');
const router = express.Router();

const itemsController = require('../../controllers/items/items.controller');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');

const updateItemSchema = require('../../validators/items/updateItem.schema');
const idParamSchema = require('../../validators/items/idParam.schema');
const { paginationSchema } = require('../../validators/shared/pagination.schema');

// GET /items  — list with pagination/sort
router.get(
  '/',
  validate({ query: paginationSchema }),
  itemsController.getItems
);

// GET /items/self (auth required) — list with pagination/sort
router.get(
  '/self',
  requireAuth,
  validate({ query: paginationSchema }),
  itemsController.getSelfItems
);

// GET /items/:id — validate UUID
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  itemsController.getItemById
);

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
router.delete(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  itemsController.deleteItem
);

// PATCH /items/:id/status
router.patch(
  '/:id/status',
  requireAuth,
  validate({ params: idParamSchema }),
  itemsController.updateItemStatus
);

// POST /items/:id/photos  (attach photos)
router.post(
  '/:id/photos',
  requireAuth,
  validate({ params: idParamSchema }),
  itemsController.addItemPhotos
);

// DELETE /items/:id/photos/:photoId  (remove photo)
router.delete(
  '/:id/photos/:photoId',
  requireAuth,
  itemsController.deleteItemPhoto
);


module.exports = router;
