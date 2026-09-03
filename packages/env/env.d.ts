import type { D1Database, KVNamespace, Queue, R2Bucket } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  QUEUE: Queue;
  NANGO_SECRET_KEY?: string;
  NANGO_HOST?: string;
}

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
