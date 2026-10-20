import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const shellDevUserSwitch = process.env.DEV_USER_SWITCH;

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
});

// next build sets NODE_ENV=production. Do not inherit the local-dev switcher
// from the shared .env file. Hosting still fails if DEV_USER_SWITCH is set true.
if (process.env.NODE_ENV === 'production' && shellDevUserSwitch === undefined) {
  delete process.env.DEV_USER_SWITCH;
}

if (process.env.NODE_ENV === 'production' && process.env.DEV_USER_SWITCH === 'true') {
  throw new Error("DEV_USER_SWITCH must not be true in production!");
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

