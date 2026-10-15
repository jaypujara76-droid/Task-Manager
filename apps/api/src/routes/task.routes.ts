import { Router } from "express";

import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema.js";

import { validateBody } from "../middlewares/validate.middleware.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import prisma from "../lib/prisma.js";

const router = Router();

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| GET /tasks
|--------------------------------------------------------------------------
| Admin  -> all tasks
| User   -> only own tasks
|--------------------------------------------------------------------------
*/
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const currentUser = req.user!;

    const tasks = await prisma.task.findMany({
      where:
        currentUser.role === "admin"
          ? {}
          : {
              userId: currentUser.userId,
            },
    });

    const response = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      completed: task.completed,
      ownerId: task.userId,
    }));

    res.status(200).json(response);
  }),
);

/*
|--------------------------------------------------------------------------
| GET /tasks/:id
|--------------------------------------------------------------------------
| Admin  -> can access any task
| User   -> can access only own task
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| POST /tasks
|--------------------------------------------------------------------------
| Task ownership comes from authenticated user.
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validateBody(createTaskSchema),
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

/*
|--------------------------------------------------------------------------
| PUT /tasks/:id
|--------------------------------------------------------------------------
| Admin  -> can update any task
| User   -> can update only own task
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  validateBody(updateTaskSchema),
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

/*
|--------------------------------------------------------------------------
| PATCH /tasks/:id
|--------------------------------------------------------------------------
| Admin  -> can update any task
| User   -> can update only own task
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id",
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

/*
|--------------------------------------------------------------------------
| DELETE /tasks/:id
|--------------------------------------------------------------------------
| Admin  -> can delete any task
| User   -> can delete only own task
|--------------------------------------------------------------------------
*/

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
