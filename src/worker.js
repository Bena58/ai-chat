export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route: POST /api/chat
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        // Validate AI binding exists
        if (!env.AI) {
          return Response.json(
            { error: "AI service not configured" },
            { status: 500 }
          );
        }

        const { message } = await request.json();

        if (!message || typeof message !== "string") {
          return Response.json(
            { error: "Missing or invalid 'message' field" },
            { status: 400 }
          );
        }

        // Call Workers AI
        const response = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: message },
            ],
          }
        );

        return Response.json({ reply: response.response });
      } catch (err) {
        return Response.json(
          { error: "Something went wrong: " + err.message },
          { status: 500 }
        );
      }
    }

    // All other routes → static assets (handled by [assets])
    return new Response("Not Found", { status: 404 });
  },
};