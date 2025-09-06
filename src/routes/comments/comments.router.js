const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const commentIdParamSchema = require('../../validators/comments/idParam.schema');
const { deleteComment } = require('../../controllers/comments/comments.controller');

// DELETE /comments/:id
router.delete('/:id',
  requireAuth,
  validate({ params: commentIdParamSchema }),
  deleteComment
);

module.exports = router;
