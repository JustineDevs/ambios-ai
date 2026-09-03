export function json(data: unknown, status = 200) {
  return Response.json(
    { data },
    {
      status,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}

export function error(
  message: string,
  status = 400,
  code = status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST",
  details?: unknown,
) {
  const body = {
    type: `https://ambios.ai/problems/${code.toLowerCase()}`,
    title: code,
    status,
    detail: message,
    code,
    ...(details === undefined ? {} : { details }),
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/problem+json",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
