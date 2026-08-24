import { z } from "zod";
import { usernameSchema } from "@/lib/validation/community";

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(6).max(128),
  company: z.string().max(80).optional(),
  startedAt: z.number().int().optional(),
});

export const registerSchema = loginSchema.extend({
  username: usernameSchema,
  displayName: z.string().trim().max(80).optional(),
});
