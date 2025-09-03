// src/routes/categories/categories.router.js
const express = require('express');
const router = express.Router();
const categoriesController = require('../../controllers/categories/categories.controller.js');

router.get('/', categoriesController.getCategories);
router.get('/:id', categoriesController.getCategoryById);
router.post('/', categoriesController.createCategory);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
