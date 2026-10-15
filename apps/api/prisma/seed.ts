import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting seed...");

  // Hash passwords
  const jayPasswordHash = await bcrypt.hash("123456", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const rahulPasswordHash = await bcrypt.hash("rahul123", 10);

  // Remove existing seed data first
  await prisma.task.deleteMany();

  await prisma.user.deleteMany();

  // Create Jay
  const jay = await prisma.user.create({
    data: {
      username: "jay",
      email: "jay@example.com",
      passwordHash: jayPasswordHash,
      role: "user",

      tasks: {
        create: [
          {
            title: "Learn Node.js",
            description: "Practice Express APIs",
            completed: false,
          },
          {
            title: "Learn PostgreSQL",
            description: "Practice SQL queries",
            completed: false,
          },
          {
            title: "Learn Prisma",
            description: "Practice Prisma ORM",
            completed: true,
          },
        ],
      },
    },
  });

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "admin",

      tasks: {
        create: [
          {
            title: "Manage Users",
            description: "Practice user management",
            completed: false,
          },
          {
            title: "Review Tasks",
            description: "Review task progress",
            completed: true,
          },
        ],
      },
    },
  });

  // Create Rahul
  const rahul = await prisma.user.create({
    data: {
      username: "rahul",
      email: "rahul@example.com",
      passwordHash: rahulPasswordHash,
      role: "user",

      tasks: {
        create: [
          {
            title: "Learn TypeScript",
            description: "Practice TypeScript basics",
            completed: false,
          },
          {
            title: "Learn Express",
            description: "Build REST APIs",
            completed: false,
          },
        ],
      },
    },
  });

  console.log(`Created user: ${jay.username}`);
  console.log(`Created user: ${admin.username}`);
  console.log(`Created user: ${rahul.username}`);

  console.log("Seed completed!");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
