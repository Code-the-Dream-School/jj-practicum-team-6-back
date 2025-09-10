const { z } = require('zod');

const E164 = /^\+?[1-9]\d{1,14}$/;

const updateProfileBodySchema = z
  .object({
    firstName: z.string().trim().min(2).max(60).optional(),
    lastName: z.string().trim().min(2).max(60).optional(),
    phoneNumber: z.string().trim().regex(E164, 'Phone must be E.164 like +11234567890').optional(),
    zipCode: z.string().trim().min(3).max(10).optional(),
  })
  .strict();

module.exports = { updateProfileBodySchema };
