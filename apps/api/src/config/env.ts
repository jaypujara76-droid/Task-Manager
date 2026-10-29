import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    PORT: z.preprocess(
      (value) => (value === undefined || value === "" ? 3001 : Number(value)),
      z.number().int().min(1).max(65535),
    ),

    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === "postgres:" || url.protocol === "postgresql:";
        } catch {
          return false;
        }
      }, "DATABASE_URL must be a valid PostgreSQL connection URL"),

    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  })
  .superRefine((env, ctx) => {
    // Allow short test secrets, but require a strong secret elsewhere.
    if (env.NODE_ENV !== "test" && env.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be at least 32 characters long",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");

  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  throw new Error("Application startup failed due to invalid environment variables.");
}

export const env = result.data;
