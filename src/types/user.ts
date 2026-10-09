export type Role = "admin" | "user";

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
  