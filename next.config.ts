import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const useRemoteBindings = process.env.CF_REMOTE_BINDINGS === "true";

initOpenNextCloudflareForDev({
  remoteBindings: useRemoteBindings,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.rareblocks.xyz",
      },
    ],
  },
};

export default nextConfig;
