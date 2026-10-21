import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";
import { Role } from "../types/user.js";

interface JwtPayload {
  userId: number;
  username: string;
  role: Role;
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("userId" in value) || !("username" in value) || !("role" in value)) {
    return false;
  }

  return (
    typeof value.userId === "number" &&
    typeof value.username === "string" &&
    (value.role === "admin" || value.role === "user")
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    const decoded: unknown = jwt.verify(token, secret);

    if (!isJwtPayload(decoded)) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

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

    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role as Role,
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
