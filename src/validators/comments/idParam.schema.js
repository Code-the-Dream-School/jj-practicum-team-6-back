const { z } = require('zod');

const commentIdParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

module.exports = commentIdParamSchema;
