import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { users } from "../data/users.js";
import type { JwtPayload } from "../types/user.js";
import { BadRequestError } from "../errors/BadRequestError.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = users.find(
    (user) => user.username === username && user.password === password,
  );

  if (!user) {
    throw new BadRequestError("Invalid username or password");
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });

  res.json({
    message: "Login successful",
    token,
  });
});
router.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});
export default router;
