import { z } from "zod";

//define a schema
const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  completed: z.boolean(),
});

//valid data
const validTask = {
  title: "   My Task  ",
  completed: false,
};

// parse(): returns validated data or throws an error
const parsedTask = taskInputSchema.parse(validTask);

console.log("Parsed Task:", parsedTask);

const result = taskInputSchema.safeParse({ title: "", completed: false });

if (result.success) {
  console.log("Valid data:", result.data);
} else {
  console.log("Validation errors:", result.error.issues);
}

const invalidTask = taskInputSchema.safeParse({
  title: "",
  completed: "false",
});

if (!invalidTask.success) {
  for (const issue of invalidTask.error.issues) {
    console.log("Field:", issue.path.join("."));
    console.log("Problem:", issue.message);
  }
}
