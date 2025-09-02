// src/controllers/categories/categories.controller.js
const categoriesService = require('../../services/categories/categories.service');

// GET /api/v1/categories
async function getCategories(req, res, next) {
  try {
    const { categories, count } = await categoriesService.getAllCategories();
    res.status(200).json({ success: true, data: categories, meta: { count } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/categories/:id
async function getCategoryById(req, res, next) {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Not found' });

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/categories
async function createCategory(req, res, next) {
  try {
    const categoryRes = await categoriesService.createCategory(req.body);
    if (categoryRes.error) {
      // Category name is empty or already exists
      return res.status(categoryRes.status).json({
        success: false,
        message: categoryRes.message,
      });
    }
    res.status(201).json({ success: true, data: categoryRes.category });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/categories/:id
async function updateCategory(req, res, next) {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body);
    if (!category)
      return res.status(404).json({
        success: false,
        message: 'Not found or does not exist',
      });

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/categories/:id
async function deleteCategory(req, res, next) {
  try {
    const deleted = await categoriesService.deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });

    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
