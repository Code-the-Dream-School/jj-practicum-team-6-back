const { z } = require('zod');

// Strict login payload validation
const loginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

module.exports = { loginSchema };
