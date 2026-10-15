import express from "express";
import healthRouter from "./routes/health.routes.js";
import taskRouter from "./routes/task.routes.js";
import authRouter from "./routes/auth.routes.js";
import { logger } from "./middlewares/logger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

app.use(express.json());
app.use("/login", loginLimiter);

app.use(logger);

app.use(healthRouter);
app.use(authRouter);
app.use("/tasks", taskRouter);

app.use(errorHandler);

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

export default app;
