import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  clientPrefix: "NEXT_PUBLIC_",
  client: {},
  runtimeEnvStrict: {},
  emptyStringAsUndefined: true,
});
