import { defineConfig } from "drizzle-kit";
import { env } from "./lib/db/env.mjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
