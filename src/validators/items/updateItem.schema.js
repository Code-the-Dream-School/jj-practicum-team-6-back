const { z } = require('zod');

const StatusEnum = z.enum(['LOST', 'FOUND', 'RESOLVED']);

const updateItemSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: StatusEnum.optional(),
  categoryName: z.string().min(2).optional(),
  zipCode: z.string().max(20).optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  isResolved: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field required',
});

module.exports = updateItemSchema;
