import { z } from 'zod';

export const SignupDTO = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  countryCode: z.enum(['+91', '+1', '+44', '+61', '+971', '+49', '+33', '+81']),
  phone: z.string().regex(/^\d{7,15}$/),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[!@#$%^&*]/),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword']
});