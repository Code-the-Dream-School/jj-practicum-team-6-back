const express = require('express');
const router = express.Router();
const itemsCtrl = require('../../controllers/items/items.controller');
const { requireAuth } = require('../../middleware/auth');

router.get('/', itemsCtrl.getItems);
router.get('/self', requireAuth, itemsCtrl.getSelfItems);
router.get('/:id', itemsCtrl.getItemById);
router.post('/', requireAuth, itemsCtrl.createItem);

module.exports = router;
