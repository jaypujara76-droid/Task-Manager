import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, "../../../.env"),
});

const { env } = await import("./config/env.js");

const { default: app } = await import("./app.js");

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
