import type {
  Task,
  CreateTaskInput,
  ReplaceTaskInput,
  UpdateTaskInput,
} from "@task-manager/shared";

export type { Task, CreateTaskInput, ReplaceTaskInput, UpdateTaskInput };

export interface TaskParams {
  id: string;
}
