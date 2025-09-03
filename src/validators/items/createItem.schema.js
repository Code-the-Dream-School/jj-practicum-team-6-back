const { z } = require('zod');

const StatusEnum = z.enum(['LOST', 'FOUND', 'RESOLVED']);

const createItemSchema = z.object({
  title: z.string().min(2, 'Title is too short'),
  description: z.string().max(1000).optional(),
  status: StatusEnum,
  categoryId: z.string().uuid('categoryId must be UUID'),
  zipCode: z.string().max(20).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

module.exports = createItemSchema;
