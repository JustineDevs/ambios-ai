export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(
      `AmbiOS AI worker received ${request.method} ${new URL(request.url).pathname}`,
    );
  },
};
