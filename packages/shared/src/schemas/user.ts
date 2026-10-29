import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export const userSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().trim().min(3),
  role: userRoleSchema,
});

export type User = z.infer<typeof userSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
