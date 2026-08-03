import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Default is 1MB — well under MAX_ATTACHMENT_BYTES (20MB, see
  // src/lib/attachments/storage.ts). Without this, a large-but-valid
  // attachment hits Next's own hard cap before the upload action's friendlier
  // "file is too large" check ever runs.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
