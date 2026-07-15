import { z } from "zod";

export const LoginDTO = z.object({
  email: z
    .string()
    .min(1, "Email address is required.")
    .email("Invalid email address schema formatting context."),

  password: z
    .string()
    .min(1, "Password configuration field cannot be processed blank."),

  captchaToken: z
    .string()
    .min(1, "reCAPTCHA validation string token mandatory."),

  rememberMe: z
    .boolean()
    .optional()
    .default(false)
});