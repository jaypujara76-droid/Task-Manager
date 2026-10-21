import { Request, Response, NextFunction } from "express";

import prisma from "../lib/prisma.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";

export async function checkTaskOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = Number(req.params.id);

    // Find the task in PostgreSQL
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const currentUser = req.user!;

    // Admin can access any task
    if (currentUser.role === "admin") {
      return next();
    }

    // Normal user can only access their own task
    if (task.userId !== currentUser.userId) {
      throw new ForbiddenError("You are not allowed to access this task");
    }

    next();
  } catch (error) {
    next(error);
  }
}
