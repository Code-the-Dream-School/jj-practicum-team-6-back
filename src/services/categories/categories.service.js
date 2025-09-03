// src/services/categories/categories.service.js
const categoriesRepo = require('../../repositories/categories/categories.repository');

async function getAllCategories() {
  const categories = await categoriesRepo.findAllSorted();
  return {
    categories,
    count: categories.length,
  };
}

async function getCategoryById(name) {
  return categoriesRepo.findByName(name);
}

async function createCategory(data) {
  // checking for empty name
  if (!data.name || data.name.trim() === '') {
    return {
      invalid: true,
      message: 'Category name cannot be empty',
    };
  }

  // checking if category already exists
  const existing = await categoriesRepo.findByName(data.name);
  if (existing) {
    return {
      error: true,
      status: 409,
      message: `Category "${existing.name}" already exists`,
    };
  }

  const category = await categoriesRepo.create(data);
  return { exists: false, category };
}

async function updateCategory(name, data) {
  try {
    const updated = await categoriesRepo.update(name, data);
    return updated;
  } catch (err) {
    if (err.code === 'P2025') {
      // if category not found
      return null;
    }
    throw err;
  }
}

async function deleteCategory(name) {
  try {
    const deleted = await categoriesRepo.remove(name);
    return deleted;
  } catch (err) {
    if (err.code === 'P2025') {
      // if category not found
      return null;
    }
    throw err;
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
