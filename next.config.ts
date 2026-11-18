import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hide the dev-tools "N" indicator — it never appears in production builds,
  // and this keeps it out of dev-mode demos as well. Errors still surface.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
