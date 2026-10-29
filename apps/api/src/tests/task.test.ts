import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";

const prismaMocks = vi.hoisted(() => ({
  findUserUnique: vi.fn(),
  findTasks: vi.fn(),
  countTasks: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: prismaMocks.findUserUnique,
    },
    task: {
      findMany: prismaMocks.findTasks,
      count: prismaMocks.countTasks,
    },
  },
}));

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/task_manager_test";
process.env.JWT_SECRET ??= "test-secret";

const app = (await import("../app.js")).default;
const userToken = jwt.sign({ userId: 1, username: "jay", role: "user" }, process.env.JWT_SECRET);
const adminToken = jwt.sign(
  { userId: 2, username: "admin", role: "admin" },
  process.env.JWT_SECRET,
);

const users = [
  { id: 1, username: "jay", role: "user" },
  { id: 2, username: "admin", role: "admin" },
];

beforeEach(() => {
  prismaMocks.findUserUnique.mockImplementation(
    async ({ where }: { where: { id: number } }) =>
      users.find((user) => user.id === where.id) ?? null,
  );
  prismaMocks.findTasks.mockResolvedValue([]);
  prismaMocks.countTasks.mockResolvedValue(0);
});

describe("Task API Authentication", () => {
  it("rejects requests without a token", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const response = await request(app).get("/tasks").set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("allows an authenticated user", async () => {
    const response = await request(app).get("/tasks").set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        totalTasks: 0,
        totalPages: 0,
      },
    });
  });

  it("allows an authenticated admin", async () => {
    const response = await request(app).get("/tasks").set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        totalTasks: 0,
        totalPages: 0,
      },
    });
  });
});
