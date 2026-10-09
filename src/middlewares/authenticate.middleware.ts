import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";
import { Role } from "../types/user.js";

interface JwtPayload {
  userId: number;
  username: string;
  role: Role;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Look up the real user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    // Attach real DB user to request
    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}