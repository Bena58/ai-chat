const MODELS = {
  // Cloudflare Workers AI models
  "llama-4-scout-17b": { provider: "workers-ai", model: "@cf/meta/llama-4-scout-17b-16e-instruct" },
  "llama-3.3-70b": { provider: "workers-ai", model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" },
  "qwen3-30b": { provider: "workers-ai", model: "@cf/qwen/qwen3-30b-a3b-fp8" },
  "deepseek-r1-32b": { provider: "workers-ai", model: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" },
  "gpt-oss-120b": { provider: "workers-ai", model: "@cf/openai/gpt-oss-120b" },
  "kimi-k2.5": { provider: "workers-ai", model: "@cf/moonshotai/kimi-k2.5" },
  "nemotron-120b": { provider: "workers-ai", model: "@cf/nvidia/nemotron-3-120b-a12b" },
  // Google Gemini models
  "gemini-2.0-flash": { provider: "gemini", model: "gemini-2.0-flash" },
  "gemini-2.5-flash": { provider: "gemini", model: "gemini-2.5-flash" },
  "gemini-2.5-pro": { provider: "gemini", model: "gemini-2.5-pro" },
};

async function handleWorkersAI(env, modelId, message) {
  if (!env.AI) {
    throw new Error("AI service not configured");
  }
  const response = await env.AI.run(modelId, {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: message },
    ],
  });

  // Models return responses in different formats
  if (typeof response === "string") return response;
  if (response.response) return response.response;
  if (response.result) return response.result;
  if (response.choices?.[0]?.message?.content) return response.choices[0].message.content;
  if (response.content) return response.content;

  // Fallback: stringify whatever we got so it's not "undefined"
  return JSON.stringify(response);
}

async function handleGemini(env, modelId, message) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: "You are a helpful assistant." }] },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const errMsg = errBody?.error?.message || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /api/models — return available models
    if (url.pathname === "/api/models" && request.method === "GET") {
      const models = Object.entries(MODELS).map(([id, { provider }]) => ({ id, provider }));
      return Response.json({ models });
    }

    // POST /api/chat
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message, model: modelKey } = await request.json();

        if (!message || typeof message !== "string") {
          return Response.json({ error: "Missing or invalid 'message' field" }, { status: 400 });
        }

        const selected = MODELS[modelKey];
        if (!selected) {
          return Response.json(
            { error: `Unknown model '${modelKey}'. Valid: ${Object.keys(MODELS).join(", ")}` },
            { status: 400 }
          );
        }

        let reply;
        if (selected.provider === "workers-ai") {
          reply = await handleWorkersAI(env, selected.model, message);
        } else if (selected.provider === "gemini") {
          reply = await handleGemini(env, selected.model, message);
        }

        return Response.json({ reply });
      } catch (err) {
        return Response.json({ error: "Something went wrong: " + err.message }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
