import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    AI_PROVIDER: z.enum(["openai", "ollama"]).default("openai").optional(),
    OPENAI_API_KEY: z.string().optional(),
    OLLAMA_BASE_URL: z.url().optional(),
    OLLAMA_MODEL: z.string().optional(),
  },
});
