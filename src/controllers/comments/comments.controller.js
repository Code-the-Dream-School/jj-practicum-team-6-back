const xss = require('xss');
const { createItemCommentSchema } = require('../../validators/comments/createItemComment.validator');
const {
    ensureItemExists,
    createItemComment,
    listItemComments,
  } = require('../../services/comments/comments.service');


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

module.exports = { postItemComment, getItemComments};
