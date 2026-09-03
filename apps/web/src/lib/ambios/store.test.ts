import { describe, expect, it } from "vitest";

import { getStore, runHotfix } from "./store";

describe("AmbiOS hot-fix flow", () => {
  it("records an action and doc proposal for an incident", () => {
    const beforeActions = getStore().actions.length;
    const beforeDocs = getStore().docs.length;
    const result = runHotfix(
      "inc_checkout_latency",
      "Inspect checkout latency and propose a safe fix",
    );

    expect(result.action?.status).toBe("completed");
    expect(result.doc?.status).toBe("proposal");
    expect(getStore().actions).toHaveLength(beforeActions + 1);
    expect(getStore().docs).toHaveLength(beforeDocs + 1);
  });
});
