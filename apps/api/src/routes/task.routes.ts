import { Router } from "express";

import {
  createTaskInputSchema,
  replaceTaskInputSchema,
  updateTaskInputSchema,
} from "@task-manager/shared";

import { validateBody } from "../middlewares/validate.middleware.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import prisma from "../lib/prisma.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const currentUser = req.user!;

    // 1. Read pagination values from query parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    // 2. Calculate how many tasks to skip
    const skip = (page - 1) * limit;

    // 3. Apply the existing role-based filter
    const where =
      currentUser.role === "admin"
        ? {}
        : {
            userId: currentUser.userId,
          };

    // 4. Fetch the current page and count matching tasks
    const [tasks, totalTasks] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          id: "asc",
        },
      }),
      prisma.task.count({
        where,
      }),
    ]);

    // 5. Keep your existing response mapping
    const response = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      completed: task.completed,
      ownerId: task.userId,
    }));

    // 6. Return tasks with pagination metadata
    res.status(200).json({
      data: response,
      pagination: {
        page,
        limit,
        totalTasks,
        totalPages: Math.ceil(totalTasks / limit),
      },
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
