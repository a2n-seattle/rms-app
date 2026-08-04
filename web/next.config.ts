import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // web/ is a subdirectory of the rms-app monorepo (which has its own
  // root package-lock.json for the Expo app) -- pin the workspace root
  // explicitly so Turbopack doesn't have to guess.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
