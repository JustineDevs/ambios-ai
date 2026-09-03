import "@ambios-ai/env/web";
import { operationRegistry, serviceOriginsFromEnv } from "@ambios-ai/shared";
import type { NextConfig } from "next";

const isVercelBuild = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const origins = serviceOriginsFromEnv({
  ...process.env,
  // Vercel's build environment is the production boundary. Never allow a
  // copied local `.env` value to turn a production rewrite into 127.0.0.1.
  NODE_ENV: isVercelBuild ? "production" : process.env.NODE_ENV,
});
const nextPath = (template: string) => template.replace(/\/\*/g, "/:path*");
const coreRewrites = operationRegistry
  .filter((operation) => operation.runtimeOwner === "core-api" && operation.frontendAvailability)
  .filter(
    (operation, index, list) =>
      list.findIndex((candidate) => candidate.pathTemplate === operation.pathTemplate) === index,
  )
  .map((operation) => ({
    source: nextPath(operation.pathTemplate),
    destination: `${origins.coreApiOrigin}${nextPath(operation.pathTemplate)}`,
  }));
const connectorRewrites = operationRegistry
  .filter(
    (operation) =>
      operation.runtimeOwner === "connector-execution" && operation.frontendAvailability,
  )
  .filter((operation) => operation.pathTemplate.startsWith("/api/"))
  .filter(
    (operation, index, list) =>
      list.findIndex((candidate) => candidate.pathTemplate === operation.pathTemplate) === index,
  )
  .filter(
    (operation) =>
      !operationRegistry.some(
        (candidate) =>
          candidate.runtimeOwner === "core-api" &&
          candidate.pathTemplate === operation.pathTemplate,
      ),
  )
  .map((operation) => ({
    source: nextPath(operation.pathTemplate),
    destination: `${origins.connectorApiOrigin}${nextPath(operation.pathTemplate)}`,
  }));

const nextConfig: NextConfig = {
  typedRoutes: false,
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@hugeicons/react", "react-icons"],
  },
  transpilePackages: ["shiki"],
  async rewrites() {
    return [...connectorRewrites, ...coreRewrites];
  },
};

export default nextConfig;
