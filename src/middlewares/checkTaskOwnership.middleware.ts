import { Request, Response, NextFunction } from "express";
import { tasks } from "../data/tasks.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export const checkTaskOwnership = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const taskId = Number(req.params.id);

  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  const currentUser = req.user!;

  // Admin can access any task.
  if (currentUser.role === "admin") {
    return next();
  }

  // Regular users can access only their own tasks.
  if (task.ownerId !== currentUser.userId) {
    throw new ForbiddenError("You do not have permission to access this task");
  }

  next();
};
