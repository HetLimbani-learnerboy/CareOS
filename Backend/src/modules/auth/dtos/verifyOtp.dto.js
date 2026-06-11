import { z } from 'zod';

export const VerifyOtpDTO = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
});