export async function createContext(req: Request) {
  return {
    requestId: req.headers.get("x-request-id") ?? crypto.randomUUID(),
    hasAuthorization: req.headers.has("authorization"),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
