const { z } = require('zod');

const StatusEnum = z.enum(['LOST', 'FOUND', 'RESOLVED']);

const querySchema = z.object({
  status: StatusEnum.optional(),
  category: z.string().optional(), 
  is_resolved: z
    .string()
    .optional()
    .transform((v) => (v ? ['true', '1', 'yes'].includes(v.toLowerCase()) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = querySchema;
