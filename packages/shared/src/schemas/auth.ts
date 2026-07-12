import { z } from "zod";
import { ALL_ROLES } from "../roles";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
  seniority: z.string().optional(),
  skillIds: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
