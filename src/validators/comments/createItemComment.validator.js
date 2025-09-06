const { z } = require('zod');

const createItemCommentSchema = z.object({
  body: z.string().trim().min(1, 'Body is required').max(1000, 'Max 1000 chars'),
});

module.exports = { createItemCommentSchema };
