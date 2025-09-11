const { z } = require('zod');

const uuid = z.string().uuid();

// Body schema for POST /threads
const createThreadBodySchema = z
  .object({
    itemId: uuid,
    participantId: uuid,
  })
  .strict();

// Query schema for GET /threads
const listThreadsQuerySchema = z
  .object({
    itemId: uuid.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
  })
  .strict();

module.exports = {
  createThreadBodySchema,
  listThreadsQuerySchema,
};
