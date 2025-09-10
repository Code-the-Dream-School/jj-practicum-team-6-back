const { z } = require('zod');

const StatusEnum = z.enum(['LOST', 'FOUND', 'RESOLVED']);

const querySchema = z.object({
  status: StatusEnum.optional(),
  category: z.string().optional(),
  is_resolved: z
    .string()
    .optional()
    .transform(v => (v ? ['true', '1', 'yes'].includes(v.toLowerCase()) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),

  // 🔎 text search
  q: z.string().optional(),

  // geo + zip
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().optional(),
  zip: z.string().regex(/^\d{5}$/).optional()
});

module.exports = querySchema;
