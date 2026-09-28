import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // AUTH_SECRET: z.string().min(1),
  // AUTH_URL: z.string().url(),
  // STORAGE_URL: z.string().url(),
  // STORAGE_KEY: z.string().min(1),
  // STORAGE_SECRET: z.string().min(1),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  // AUTH_SECRET: process.env.AUTH_SECRET,
  // AUTH_URL: process.env.AUTH_URL,
  // STORAGE_URL: process.env.STORAGE_URL,
  // STORAGE_KEY: process.env.STORAGE_KEY,
  // STORAGE_SECRET: process.env.STORAGE_SECRET,
});
