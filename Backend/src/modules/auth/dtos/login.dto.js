import { z } from "zod";

export const LoginDTO = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(1, { message: "Password is required" }),
  captchaToken: z.string({ required_error: "Verification token is explicitly required" }) 
});