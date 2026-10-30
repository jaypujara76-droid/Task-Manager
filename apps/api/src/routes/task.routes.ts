import { Router } from "express";

import {
  createTaskInputSchema,
  replaceTaskInputSchema,
  updateTaskInputSchema,
  taskQuerySchema,
} from "@task-manager/shared";

import { validateBody } from "../middlewares/validate.middleware.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../errors/BadRequestError.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const currentUser = req.user!;

    // Validate query parameters using Zod
    const result = taskQuerySchema.safeParse(req.query);

    if (!result.success) {
      throw new BadRequestError("Invalid query parameters", result.error.flatten());
    }

    const { status, cursor, limit } = result.data;

    // Base condition for role-based access control
    const userWhere = {
      ...(currentUser.role !== "admin" && {
        userId: currentUser.userId,
      }),
    };

    // Apply status filtering and cursor pagination
    const where = {
      ...userWhere,

      ...(status !== undefined && {
        completed: status === "completed",
      }),

      ...(cursor !== undefined && {
        id: {
          gt: cursor,
        },
      }),
    };

    // Fetch paginated tasks and summary counts in parallel
    const [tasks, totalTasks, completedTasks] = await Promise.all([
      // Fetch one extra task to check whether another page exists
      prisma.task.findMany({
        where,
        take: limit + 1,
        orderBy: {
          id: "asc",
        },
      }),

      // Count all tasks belonging to the current user
      prisma.task.count({
        where: userWhere,
      }),

      // Count all completed tasks belonging to the current user
      prisma.task.count({
        where: {
          ...userWhere,
          completed: true,
        },
      }),
    ]);

    // Determine whether another page exists
    const hasMore = tasks.length > limit;

    // Remove the extra record
    const paginatedTasks = hasMore ? tasks.slice(0, limit) : tasks;

    // Map Prisma records to API response format
    const response = paginatedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      completed: task.completed,
      ownerId: task.userId,
    }));

    // Generate the next cursor
    const lastTask = paginatedTasks.at(-1);

    const nextCursor = hasMore && lastTask ? String(lastTask.id) : null;

    // Calculate remaining tasks
    const remainingTasks = totalTasks - completedTasks;

    // Return paginated tasks and global summary counts
    res.status(200).json({
      data: response,
      nextCursor,
      totalTasks,
      completedTasks,
      remainingTasks,
    });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const currentUser = req.user!;

    const task = await prisma.task.findFirst({
      where:
        currentUser.role === "admin"
          ? {
              id,
            }
          : {
              id,
              userId: currentUser.userId,
            },
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const response = {
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      completed: task.completed,
      ownerId: task.userId,
    };

    res.status(200).json(response);
  }),
);

router.post(
  "/",
  validateBody(createTaskInputSchema),
  asyncHandler(async (req, res) => {
    const currentUser = req.user!;

    const newTask = await prisma.task.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        completed: false,

        userId: currentUser.userId,
      },
    });

    const response = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description ?? "",
      completed: newTask.completed,
      ownerId: newTask.userId,
    };

    res.status(201).json(response);
  }),
);

router.put(
  "/:id",
  validateBody(replaceTaskInputSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const currentUser = req.user!;

    const result = await prisma.task.updateMany({
      where:
        currentUser.role === "admin"
          ? {
              id,
            }
          : {
              id,
              userId: currentUser.userId,
            },

      data: {
        title: req.body.title,
        description: req.body.description,
        completed: req.body.completed,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Task not found");
    }

    const updatedTask = await prisma.task.findFirst({
      where:
        currentUser.role === "admin"
          ? { id }
          : {
              id,
              userId: currentUser.userId,
            },
    });
    if (!updatedTask) {
      throw new NotFoundError("Task not found");
    }

    const response = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description ?? "",
      completed: updatedTask.completed,
      ownerId: updatedTask.userId,
    };

    res.status(200).json(response);
  }),
);

router.patch(
  "/:id",
  validateBody(updateTaskInputSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const currentUser = req.user!;

    const result = await prisma.task.updateMany({
      where:
        currentUser.role === "admin"
          ? {
              id,
            }
          : {
              id,
              userId: currentUser.userId,
            },

      data: {
        ...(req.body.title !== undefined && {
          title: req.body.title,
        }),

        ...(req.body.description !== undefined && {
          description: req.body.description,
        }),

        ...(req.body.completed !== undefined && {
          completed: req.body.completed,
        }),
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Task not found");
    }

    const updatedTask = await prisma.task.findFirst({
      where: {
        id,
      },
    });

    if (!updatedTask) {
      throw new NotFoundError("Task not found");
    }

    const response = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description ?? "",
      completed: updatedTask.completed,
      ownerId: updatedTask.userId,
    };

    res.status(200).json(response);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const currentUser = req.user!;

    const result = await prisma.task.deleteMany({
      where:
        currentUser.role === "admin"
          ? {
              id,
            }
          : {
              id,
              userId: currentUser.userId,
            },
    });

    if (result.count === 0) {
      throw new NotFoundError("Task not found");
    }

    res.status(200).json({
      message: "Task deleted successfully",
    });
  }),
);

export default router;
