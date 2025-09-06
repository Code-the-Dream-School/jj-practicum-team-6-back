const xss = require('xss');
const { createItemCommentSchema } = require('../../validators/comments/createItemComment.validator');
const {
  ensureItemExists,
  createItemComment,
  listItemComments,
  getCommentWithItem,
  deleteCommentById,
} = require('../../services/comments/comments.service');

// POST /items/:id/comments
async function postItemComment(req, res, next) {
  try {
    const itemId = req.params.id;

    // 404 
    const exists = await ensureItemExists(itemId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
      });
    }

    const { body } = createItemCommentSchema.parse(req.body);

    const authorId = req.user?.id;
    if (!authorId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required' },
      });
    }

    // XSS sanitize
    const sanitized = xss(body);

    const comment = await createItemComment({ itemId, authorId, body: sanitized });

    return res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

//GET /items/:id/comments

async function getItemComments(req, res, next) {
  try {
    const itemId = req.params.id;

    // 404 
    const exists = await ensureItemExists(itemId);
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Item not found' },
      });
    }

    const limit = Number(req.query.limit ?? 10);
    const offset = Number(req.query.offset ?? 0);

    const { comments, count } = await listItemComments({ itemId, limit, offset });

    return res.status(200).json({
      success: true,
      data: comments,
      meta: { count, limit, offset },
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /comments/:id

async function deleteComment(req, res, next) {
  try {
    const commentId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required' },
      });
    }

    const comment = await getCommentWithItem(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Comment not found' },
      });
    }

    const isAuthor = comment.authorId === userId;
    const isItemOwner = comment.item?.ownerId === userId;

    if (!isAuthor && !isItemOwner) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not allowed to delete this comment' },
      });
    }

    await deleteCommentById(commentId);
    return res.status(204).send(); 
  } catch (err) {
    next(err);
  }
}

module.exports = { postItemComment, getItemComments, deleteComment };
