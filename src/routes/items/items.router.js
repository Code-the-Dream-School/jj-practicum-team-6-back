const express = require('express');
const router = express.Router();

const itemsController = require('../../controllers/items/items.controller');
const commentsController = require('../../controllers/comments/comments.controller');

const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');

const updateItemSchema = require('../../validators/items/updateItem.schema');
const idParamSchema = require('../../validators/items/idParam.schema');
const {
  createItemCommentSchema,
} = require('../../validators/comments/createItemComment.validator');
const querySchema = require('../../validators/items/query.schema'); // 👈 новый импорт

// GET /items — list with filters, geo, pagination/sort
router.get('/', validate({ query: querySchema }), itemsController.getItems);

// GET /items/self (auth required) — list with pagination/sort
router.get(
  '/self',
  requireAuth,
  validate({ query: querySchema }),
  itemsController.getSelfItems
);

// GET /items/:id/comments — list item comments (protected)
router.get(
  '/:id/comments',
  requireAuth,
  validate({ params: idParamSchema, query: querySchema }),
  commentsController.getItemComments
);

// GET /items/:id — validate UUID
router.get('/:id', validate({ params: idParamSchema }), itemsController.getItemById);

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

// POST /items/:id/photos (attach photos)
router.post(
  '/:id/photos',
  requireAuth,
  validate({ params: idParamSchema }),
  itemsController.addItemPhotos
);

// DELETE /items/:id/photos/:photoId (remove photo)
router.delete(
  '/:id/photos/:photoId',
  requireAuth,
  itemsController.deleteItemPhoto
);

// POST /items/:id/comments (auth required)
router.post(
  '/:id/comments',
  requireAuth,
  validate({ params: idParamSchema, body: createItemCommentSchema }),
  commentsController.postItemComment
);

module.exports = router;
