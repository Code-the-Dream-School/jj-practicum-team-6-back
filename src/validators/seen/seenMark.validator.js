// src/validators/seen/seenMark.validator.js
const { z } = require('zod');

const seenMarkSchema = z.object({});

const seenIdParamSchema = z.object({
  itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
  seenMarkId: z.string().uuid({ message: 'seenMarkId must be a valid UUID' }),
});

module.exports = {
  seenMarkSchema,
  seenIdParamSchema,
};
