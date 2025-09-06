const xss = require('xss');
const { createItemCommentSchema } = require('../../validators/comments/createItemComment.validator');
const { ensureItemExists, createItemComment } = require('../../services/comments/comments.service');


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

   
    const sanitized = xss(body);

    const comment = await createItemComment({ itemId, authorId, body: sanitized });

    return res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

module.exports = { postItemComment };
