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
    const response = await request(app).get("/api/v1/tasks");

    expect(response.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("allows an authenticated user", async () => {
    const response = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      data: [],
      nextCursor: null,
      totalTasks: 0,
      completedTasks: 0,
      remainingTasks: 0,
    });
  });

  it("allows an authenticated admin", async () => {
    const response = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      nextCursor: null,
      totalTasks: 0,
      completedTasks: 0,
      remainingTasks: 0,
    });
  });
});

describe("Task API Cursor Pagination", () => {
  const sampleTasks = [
    {
      id: 1,
      title: "Learn React",
      description: "React basics",
      completed: false,
      userId: 1,
    },
    {
      id: 2,
      title: "Learn Node.js",
      description: "Backend development",
      completed: true,
      userId: 1,
    },
    {
      id: 3,
      title: "Learn Prisma",
      description: "Database ORM",
      completed: false,
      userId: 1,
    },
  ];

  it("returns the requested number of tasks and a next cursor", async () => {
    prismaMocks.findTasks.mockResolvedValue(sampleTasks);

    const response = await request(app)
      .get("/api/v1/tasks?limit=2")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.nextCursor).toBe("2");

    expect(response.body.data[0]).toEqual({
      id: 1,
      title: "Learn React",
      description: "React basics",
      completed: false,
      ownerId: 1,
    });
  });

  it("returns null as nextCursor when there are no more tasks", async () => {
    prismaMocks.findTasks.mockResolvedValue([sampleTasks[0]]);

    const response = await request(app)
      .get("/api/v1/tasks?limit=2")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.nextCursor).toBeNull();
  });

  it("fetches tasks after the supplied cursor", async () => {
    prismaMocks.findTasks.mockResolvedValue([sampleTasks[2]]);

    const response = await request(app)
      .get("/api/v1/tasks?cursor=2&limit=2")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(prismaMocks.findTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: {
            gt: 2,
          },
        }),
        take: 3,
        orderBy: {
          id: "asc",
        },
      }),
    );
  });

  it("filters completed tasks", async () => {
    prismaMocks.findTasks.mockResolvedValue([sampleTasks[1]]);

    const response = await request(app)
      .get("/api/v1/tasks?status=completed")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(prismaMocks.findTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completed: true,
          userId: 1,
        }),
      }),
    );
  });

  it("filters pending tasks", async () => {
    prismaMocks.findTasks.mockResolvedValue([sampleTasks[0]]);

    const response = await request(app)
      .get("/api/v1/tasks?status=pending")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);

    expect(prismaMocks.findTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completed: false,
          userId: 1,
        }),
      }),
    );
  });

  it("rejects an invalid status", async () => {
    const response = await request(app)
      .get("/api/v1/tasks?status=unknown")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid query parameters");
  });

  it("rejects a limit greater than 100", async () => {
    const response = await request(app)
      .get("/api/v1/tasks?limit=500")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects a negative cursor", async () => {
    const response = await request(app)
      .get("/api/v1/tasks?cursor=-5")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("allows admins to fetch tasks without a user ownership filter", async () => {
    prismaMocks.findTasks.mockResolvedValue([]);

    const response = await request(app)
      .get("/api/v1/tasks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    expect(prismaMocks.findTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });
});
