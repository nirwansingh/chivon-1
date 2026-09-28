import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  STORAGE_URL: z.string().url().optional(),
  STORAGE_KEY: z.string().min(1).optional(),
  STORAGE_SECRET: z.string().min(1).optional(),
  DEV_USER_SWITCH: z.coerce.boolean().default(false),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  STORAGE_URL: process.env.STORAGE_URL,
  STORAGE_KEY: process.env.STORAGE_KEY,
  STORAGE_SECRET: process.env.STORAGE_SECRET,
  DEV_USER_SWITCH: process.env.DEV_USER_SWITCH,
});
