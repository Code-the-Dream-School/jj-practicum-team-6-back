const { z } = require('zod');

const StatusEnum = z.enum(['LOST', 'FOUND', 'RESOLVED']);

const updateStatusSchema = z.object({
  status: StatusEnum,
  isResolved: z.boolean().optional(),
});

module.exports = updateStatusSchema;
