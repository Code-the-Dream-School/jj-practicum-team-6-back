const { z } = require('zod');

// Body schema for creating a message
const createMessageBodySchema = z.object({
  body: z.string().min(1, 'Message body is required').max(5000, 'Message body is too long'),
  attachmentUrl: z
    .string()
    .url('attachmentUrl must be a valid URL')
    .optional()
    .nullable(),
});

// Query schema for listing messages with pagination
const listMessagesQuerySchema = z.object({
  limit: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .optional()
    .pipe(z.number().int().min(1).max(50).optional()),
  before: z.string().uuid('before must be a valid UUID').optional(),
});

module.exports = {
  createMessageBodySchema,
  listMessagesQuerySchema,
};
