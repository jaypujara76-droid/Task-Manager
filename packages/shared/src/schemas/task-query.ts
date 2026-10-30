import { z } from "zod";

export const taskQuerySchema = z.object({
  status: z.enum(["completed", "pending"]).optional(),

  cursor: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
