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
  return categoriesRepo.create(data);
}

async function updateCategory(id, data) {
  return categoriesRepo.update(id, data);
}

async function deleteCategory(id) {
  return categoriesRepo.remove(id);
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};