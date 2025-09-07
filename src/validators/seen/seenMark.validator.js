// src/validators/seen/seenMark.validator.js
const { z } = require('zod');

const seenMarkSchema = z.object({});

const seenMarkIdSchema = z.object({
  seenMarkId: z.string().uuid({ message: 'seenMarkId must be a valid UUID' }),
});

module.exports = {
  seenMarkSchema,
  seenMarkIdSchema,
};
