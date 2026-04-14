# AI Web Chat Application

A minimal AI-powered web chat application built with Cloudflare Workers, Cloudflare Workers AI, and Google Gemini API.

## Overview

This is a single-page chat application where users can send messages and receive AI-generated responses. Users can choose from 10 different AI models across two providers. The backend runs as a Cloudflare Worker that routes requests to the selected model, keeping API keys secure and never exposed to the client.

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (hosted on Cloudflare Pages via Workers Assets)
- **Backend:** Cloudflare Workers (serverless edge functions)
- **LLM Providers:**
  - **Cloudflare Workers AI** — Llama 4 Scout, Llama 3.3 70B, Qwen3 30B, DeepSeek R1 32B, GPT-OSS 120B, Kimi K2.5, Nemotron 120B
  - **Google Gemini** — Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 2.5 Pro
- **Deployment:** Cloudflare (free tier)

## Project Structure

```
ai-chat/
├── src/
│   └── worker.js          # Backend — handles /api/chat and /api/models, routes to AI providers
├── public/
│   ├── index.html          # Frontend — chat UI with model selector
│   └── style.css           # Styling
├── wrangler.toml            # Cloudflare Worker configuration
├── .dev.vars                # Local dev secrets (not committed)
├── package.json
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free — required only for Gemini models)

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Bena58/ai-chat.git
cd ai-chat
```

2. **Install dependencies:**

```bash
npm install
```

3. **Login to Cloudflare:**

```bash
npx wrangler login
```

4. **Set your Gemini API key as a secret:**

```bash
npx wrangler secret put GEMINI_API_KEY
# Paste your API key when prompted
```

## Running Locally

1. **Create a `.dev.vars` file** with your Gemini API key:

```
GEMINI_API_KEY=your-api-key-here
```

2. **Start the dev server:**

```bash
npx wrangler dev
```

Open `http://localhost:8787` in your browser.

> Note: Workers AI models and Gemini models both require an internet connection during local development.

## Deployment

```bash
npx wrangler deploy
```

After deployment, your app will be available at:

```
https://ai-chat.<your-subdomain>.workers.dev
```

## How It Works

1. User selects an AI model from the dropdown and types a message
2. Frontend sends a `POST` request to `/api/chat` with `{ "message": "...", "model": "..." }`
3. Cloudflare Worker receives the request and routes it to the correct provider:
   - **Workers AI models** — called directly via the Cloudflare AI binding
   - **Gemini models** — called via Google's REST API using the secret API key
4. The AI response is extracted and sent back to the frontend as `{ "reply": "..." }`
5. Frontend displays the AI response in the chat window

## API Endpoints

| Method | Path          | Description                    |
|--------|---------------|--------------------------------|
| GET    | `/api/models` | Returns list of available models |
| POST   | `/api/chat`   | Send a message and get a reply |

## API Key Security

- The Gemini API key is stored using `wrangler secret put`, which encrypts it on Cloudflare's servers
- The key is injected into the Worker at runtime via the `env` object
- The key never appears in source code, frontend, or the Git repository
- The browser only communicates with `/api/chat` and has no knowledge of the API key
- Workers AI models use Cloudflare's built-in AI binding and require no API key

## License

MIT
