const { z } = require('zod');

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
});

module.exports = { forgotPasswordSchema };
