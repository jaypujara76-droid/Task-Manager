import { Router, Request, Response } from "express";
import { HealthResponse } from "../types/health.js";

const router = Router();

router.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  const response: HealthResponse = {
    status: "ok",
    message: "Server is working",
  };

  res.json(response);
});

export default router;
