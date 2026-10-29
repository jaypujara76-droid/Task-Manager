import { z } from "zod";

export const taskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string(),
  completed: z.boolean(),
  ownerId: z.number().int().positive(),
});

export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
});

export const replaceTaskInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
  completed: z.boolean(),
});

export const updateTaskInputSchema = replaceTaskInputSchema.partial();

export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type ReplaceTaskInput = z.infer<typeof replaceTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
