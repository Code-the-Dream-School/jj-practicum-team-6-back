
const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

module.exports = idParamSchema;
