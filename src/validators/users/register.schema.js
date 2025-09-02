const { z } = require('zod');

const zipRegex = /^\d{5}$/; // US ZIP: exactly 5 digits
const phoneRegex = /^\+?[0-9]{10,15}$/; 

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required').max(50),
    lastName: z.string().trim().min(1, 'Last name is required').max(50),
    email: z.string().trim().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),

    confirmPassword: z.string().min(8).max(128),

    zipCode: z.string().trim().regex(zipRegex, 'ZIP code must be exactly 5 digits'),

    phoneNumber: z.string().trim().regex(phoneRegex, 'Phone must be 10–15 digits').optional(),
    avatarUrl: z.string().trim().url('Invalid URL').optional(),
  })
  
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'], 
        message: 'Passwords do not match',
      });
    }
  })
  
  .transform(({ confirmPassword, ...data }) => data);

module.exports = { registerSchema };
