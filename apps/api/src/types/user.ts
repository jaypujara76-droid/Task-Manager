import type { UserRole } from "@task-manager/shared";

export type Role = UserRole;

export interface User {
  id: number;
  username: string;
  password: string;
  role: Role;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: Role;
}
