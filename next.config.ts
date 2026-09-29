if (process.env.NODE_ENV === 'production' && process.env.DEV_USER_SWITCH === 'true') {
  throw new Error("DEV_USER_SWITCH must not be true in production!");
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '*.trycloudflare.com',
    'localhost:3000',
  ],
};

export default nextConfig;

