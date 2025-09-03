const express = require('express');
const categoriesRouter = require('../routes/categories/categories.router');
const router = express.Router();

router.get = (req, res) => {
  return res.json({
    data: 'This is a full stack app!',
  });
};

// route /api/v1/categories
router.use('/categories', categoriesRouter);

module.exports = router;
