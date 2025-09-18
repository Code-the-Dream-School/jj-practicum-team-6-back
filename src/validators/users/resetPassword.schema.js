const { z } = require('zod');

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

module.exports = { resetPasswordSchema };
