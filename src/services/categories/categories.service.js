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
  // checking if category already exists
  const existing = await categoriesRepo.findByName(data.name);
  if (existing) {
    return { exists: true, category: existing };
  }

  const category = await categoriesRepo.create(data);
  return { exists: false, category };
}

async function updateCategory(id, data) {
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

async function deleteCategory(id) {
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
