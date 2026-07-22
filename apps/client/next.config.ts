import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      "@codesandbox/sandpack-react",
      "@mdxeditor/editor",
      "@monaco-editor/react",
      "monaco-editor",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

const isCi = process.env.CI === "true" || process.env.CI === "1";

// The Sentry build plugin (source map upload) is opt-in: it only runs if
// you've set up your own Sentry project and provided SENTRY_AUTH_TOKEN.
// Without it, Sentry error reporting still works at runtime via
// NEXT_PUBLIC_SENTRY_DSN (see sentry.*.config.ts) — this only skips the
// build-time source-map upload step, which previously produced noisy
// "Auth token is required" errors in the build log because it was trying
// to upload to the original author's Sentry org with no credentials.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "dulapahv",
      project: process.env.SENTRY_PROJECT ?? "TeamEdit",
      silent: !isCi,
      widenClientFileUpload: true,
      reactComponentAnnotation: {
        enabled: true,
      },
      tunnelRoute: "/monitoring",
      disableLogger: true,
      automaticVercelMonitors: true,
      sourcemaps: {
        deleteSourcemapsAfterUpload: isCi,
      },
      telemetry: !isCi,
    })
  : nextConfig;
