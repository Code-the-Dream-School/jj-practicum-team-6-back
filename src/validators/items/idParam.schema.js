const { z } = require('zod');

module.exports = z.object({
  id: z.string().uuid('Invalid id'),
});
