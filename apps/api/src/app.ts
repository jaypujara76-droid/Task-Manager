import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import healthRouter from "./routes/health.routes.js";
import taskRouter from "./routes/task.routes.js";
import authRouter from "./routes/auth.routes.js";

import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
  }),
);

app.use(express.json());
app.use(logger);
app.use("/login", loginLimiter);

// Routes
app.use(healthRouter);

app.use("/api/v1", authRouter);
app.use("/api/v1/tasks", taskRouter);

// Error handling (after routes)
app.use(errorHandler);

export default app;
