import { beforeAll, describe, expect, it } from "vitest";

import request from "supertest";
import app from "../app.js";

let userToken: string;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";

  const userResponse = await request(app).post("/login").send({
    username: "jay",
    password: "123456",
  });

  userToken = userResponse.body.token;

  const adminResponse = await request(app).post("/login").send({
    username: "admin",
    password: "admin123",
  });

  adminToken = adminResponse.body.token;
});

describe("Task API Authentication", () => {
  it("rejects requests without a token", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const response = await request(app)
      .get("/tasks")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("allows an authenticated user", async () => {
    const response = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
  });

  it("allows an authenticated admin", async () => {
    const response = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});