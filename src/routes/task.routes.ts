import { Router, type Request, type Response } from "express";
import {
  CreateTaskBody,
  Task,
  TaskParams,
  UpdateTaskBody,
  PatchTaskBody,
} from "../types/task.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { checkTaskOwnership } from "../middlewares/checkTaskOwnership.middleware.js";

const router = Router();
router.use(authenticate);

let tasks: Task[] = [
  {
    id: 1,
    title: "Learn Node JS",
    description: "understand Node.js fundamentals",
    completed: false,
    ownerId: 1,
  },
  {
    id: 2,
    title: "learn Express",
    description: "Build Rest API with express",
    completed: false,
    ownerId: 2,
  },
];

router.get(
  "/:id",
  checkTaskOwnership,
  (req: Request<TaskParams>, res: Response<Task>) => {
    const id = Number(req.params.id);

    const task = tasks.find((task) => task.id === id);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    res.json(task);
  },
);
router.post(
  "/",
  validateBody(createTaskSchema),
  (req: Request<{}, Task, CreateTaskBody>, res: Response<Task>) => {
    const newTask: Task = {
      id: tasks.length + 1,
      title: req.body.title,
      description: req.body.description,
      completed: false,
      ownerId: req.user!.userId,
    };
    tasks.push(newTask);

    res.status(201).json(newTask);
  },
);

router.get("/", (req: Request, res: Response<Task[]>) => {
  const currentUser = req.user!;

  if (currentUser.role === "admin") {
    return res.json(tasks);
  }

  const userTasks = tasks.filter((task) => task.ownerId === currentUser.userId);

  res.json(userTasks);
});
router.put(
  "/:id",
  validateBody(updateTaskSchema),
  checkTaskOwnership,
  (req: Request<TaskParams, Task, UpdateTaskBody>, res: Response<Task>) => {
    const id = Number(req.params.id);

    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      throw new NotFoundError("Task not found");
    }

    const updatedTask: Task = {
      id,
      title: req.body.title,
      description: req.body.description,
      completed: req.body.completed,
      ownerId: tasks[taskIndex].ownerId,
    };

    tasks[taskIndex] = updatedTask;

    res.json(updatedTask);
  },
);

router.delete(
  "/:id",
  checkTaskOwnership,
  (req: Request<TaskParams>, res: Response<Task>) => {
    const id = Number(req.params.id);

    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      throw new NotFoundError("Task not found");
    }

    const deletedTask = tasks[taskIndex];

    tasks.splice(taskIndex, 1);

    res.json(deletedTask);
  },
);

// PATCH /tasks/:id
router.patch(
  "/:id",
  checkTaskOwnership,
  (req: Request<TaskParams, Task, UpdateTaskBody>, res: Response<Task>) => {
    const id = Number(req.params.id);

    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      throw new NotFoundError("Task not found");
    }

    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...req.body,
      id,
      ownerId: tasks[taskIndex].ownerId,
    };

    tasks[taskIndex] = updatedTask;

    res.json(updatedTask);
  },
);

export default router;
