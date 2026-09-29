import { Request, Response, NextFunction } from "express";
import type { Role } from "../types/user.js";
import { ForbiddenError } from "../errors/ForbiddenError.js";

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError(
        "You do not have permission to perform this action",
      );
    }

    next();
  };
};
