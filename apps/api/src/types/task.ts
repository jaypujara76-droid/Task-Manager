import type { ParamsDictionary } from "express-serve-static-core";

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  ownerId: number;
}

export interface CreateTaskBody {
  title: string;
  description: string;
}

export interface TaskParams extends ParamsDictionary {
  id: string;
}

export interface UpdateTaskBody {
  title: string;
  description: string;
  completed: boolean;
}

export interface PatchTaskBody {
  title?: string;
  description?: string;
  completed?: boolean;
}
