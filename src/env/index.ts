import { config } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV === "test") {
  config({ path: ".env.test" });
} else {
  config();
}

const envSchema = z.object({
  DATABASE_URL: z.string(),
  DATABASE_CLIENT: z.enum(["pg", "sqlite3"]),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const _env = envSchema.safeParse(process.env);

if (_env.error) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(z.treeifyError(_env.error), null, 2));
  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
