const { z } = require('zod');

// Allowed sort fields (white-list)
const SORT_FIELDS = ['dateReported', 'createdAt', 'updatedAt', 'title', 'status'];

const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1, 'page must be > 0').default(1).optional(),
    offset: z.coerce.number().int().min(0, 'offset must be >= 0').optional(),
    limit: z.coerce.number().int()
      .min(1, 'limit must be between 1 and 50')
      .max(50, 'limit must be between 1 and 50')
      .default(20),
    sortBy: z.enum(SORT_FIELDS).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .transform((data) => {
    const page = data.page ?? 1;
    const offset = data.offset ?? (page - 1) * data.limit;
    return { ...data, page, offset };
  });

module.exports = { paginationSchema };
