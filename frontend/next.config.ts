import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
});

if (process.env.NODE_ENV === 'production' && process.env.DEV_USER_SWITCH === 'true') {
  throw new Error("DEV_USER_SWITCH must not be true in production!");
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

