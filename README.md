# AI Customer Support Refund Agent

AI-powered customer support agent that **processes or denies e‑commerce refund requests** using a strict refund policy and a LangGraph-powered tool-using backend.

The project is designed as a **production-style demo**:

- A clean, editorial UI for customers to chat with a refund assistant (and optionally talk via voice).
- A LangGraph agent loop that calls tools to inspect a mock CRM, orders, and refund policy before deciding.
- An admin dashboard surface (WIP) for inspecting agent reasoning logs in real time.

---

## ✨ Features

- **Refund-focused AI agent**
  - Handles refund queries like `ORD-1001` and policy questions.
  - Applies a deterministic refund policy (time window, discount rules, high-value orders, VIP overrides, risk flags).
  - Uses the LLM only to *explain* decisions, not to make up rules.

- **Mock CRM + Orders**
  - ~15+ customer profiles with loyalty tier, VIP flag, lifetime value, and optional risk flags.
  - Orders with amounts, status, discount flags, and refund windows.
  - Easy to tweak for demo scenarios.

- **Strict Refund Policy Engine**
  - Pure TypeScript function that evaluates a given customer + order against business rules.
  - Returns a structured `PolicyResult` + decision (`approve`, `deny`, `escalate`).

- **LangGraph Agent Orchestration**
  - JS/TS LangGraph graph with nodes:
    - `parse_request`
    - `load_context` (reads CRM/orders)
    - `check_policy`
    - `decide_refund`
    - `generate_reply`
  - Keeps a `logs` channel for per-node reasoning events.

- **Editorial Chat UI (Next.js App Router)**
  - Layout inspired by high-end type-driven landing pages.
  - Left side: brand / explanation / suggested prompts.
  - Right side: glassmorphism chat panel with clear user vs. assistant bubbles.

- **Voice Input (Browser Only)**
  - Uses the **Web Speech API** for microphone → text and browser text-to-speech for replies.
  - No external speech billing needed; runs entirely in-chrome.

---

## 🧱 Tech Stack

**Frontend**

- Next.js (App Router, TypeScript)
- React 18
- Tailwind CSS (with inline fallbacks for robustness) + custom globals for editorial styling
- Web Speech API (speech recognition + speech synthesis)

**Agent Backend**

- LangGraph JS/TS (`@langchain/langgraph`) for the agent state machine.
- `@langchain/openai` client pointed at a **self-hosted OpenAI-compatible LLM**.

---

## 🗂️ Project Structure

High level layout (simplified):

```text
AI_customer_support_agent/
  app/
    layout.tsx            # Root layout, loads globals.css
    page.tsx              # Landing, links to /support and /admin
    support/page.tsx      # Customer support chat UI
    admin/page.tsx        # Admin reasoning logs view (polling JSON endpoint – easily upgradable to SSE)
    api/
      support/
        chat/route.ts     # POST /api/support/chat → LangGraph agent
        logs/[id]/route.ts# GET /api/support/logs/:id (polling JSON endpoint – easily upgradable to SSE)

  components/
    ChatWindow.tsx        # Main editorial chat UI

  lib/
    llm.ts                # OpenAI-compatible client pointing to self-hosted LLM
    agent/
      state.ts            # LangGraph state annotation
      nodes.ts            # parse_request, load_context, check_policy, decide_refund, generate_reply
      graph.ts            # compiledRefundGraph
    data/
      crm.ts              # Customers + orders + helpers
      policy.ts           # Strict refund policy + evaluateRefundPolicy()

  app/globals.css         # Editorial design system (fonts, colors, surfaces)
  package.json
  tsconfig.json
  next.config.mjs
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- pnpm / npm / yarn
- A **self-hosted LLM** exposing an OpenAI-compatible `/v1/chat/completions` endpoint
  (e.g. vLLM + FastAPI, OpenWebUI with OpenAI bridge, or custom wrapper around DeepSeek/Llama).

### 2. Clone and install

```bash
git clone https://github.com/Flacko-07/AI_customer_support_agent.git
cd AI_customer_support_agent

npm install
# or
pnpm install
```

### 3. Environment variables

Create a `.env.local` file at the project root:

```bash
# Self-hosted LLM (OpenAI-compatible)
LLM_BASE_URL=http://localhost:8000/v1
LLM_MODEL_NAME=local-llm
LLM_API_KEY=dummy            # required by the client, often ignored by self-hosted setups
```

> Adjust these values to match your local LLM setup.

### 4. Run your local LLM

You can use any OpenAI-compatible server. Example (vLLM + FastAPI):

```python
# server.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from vllm import LLM, SamplingParams

app = FastAPI()
llm = LLM("deepseek-ai/deepseek-r1-7b")  # or your own model
sampling = SamplingParams(temperature=0.0, max_tokens=256)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]

@app.post("/v1/chat/completions")
async def chat(req: ChatRequest):
    prompt = ""
    for m in req.messages:
        prompt += f"{m.role.upper()}: {m.content}\n"
    prompt += "ASSISTANT:"

    outputs = llm.generate([prompt], sampling)
    text = outputs[0].outputs[0].text

    return JSONResponse({
        "id": "chatcmpl-local",
        "object": "chat.completion",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": text},
                "finish_reason": "stop",
            }
        ],
        "model": req.model,
    })
```

Run it:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

Then make sure `LLM_BASE_URL=http://localhost:8000/v1`.

### 5. Start the dev server

```bash
npm run dev
# or
pnpm dev
```

Open:

- `http://localhost:3000/support` → customer-facing chat
- `http://localhost:3000/admin` → admin reasoning logs view (polling JSON endpoint – easily upgradable to SSE)

---

## 💬 How it Works

1. **User asks for a refund**

   On `/support`, the user types or speaks something like:

   > “I’d like a refund for order ORD-1002, it was discounted and delivered last month.”

2. **LangGraph agent runs the workflow**

   - `parse_request` – reads the latest user message.
   - `load_context` – looks up the customer and order in `lib/data/crm.ts`.
   - `check_policy` – calls `evaluateRefundPolicy()` from `lib/data/policy.ts`.
   - `decide_refund` – produces a structured decision object with `decision`, `amount`, and `refundType`.
   - `generate_reply` – invokes the LLM with a full context (request + customer + order + policy result) and asks it to write a clear, empathetic explanation.

3. **UI renders decision + reply**

   - Chat bubbles show user vs. assistant messages with editorial styling.
   - The assistant reply is also spoken aloud via the browser’s SpeechSynthesis API.

4. **Admin logs (WIP)**

   - Agent nodes push log events into a `logs` channel.
   - `/admin` currently reads from a simple JSON endpoint, but the API is structured to be easily upgraded to SSE.

---

## 🧪 Scenarios to Try

- **Standard refund**: In-window, delivered, non-discounted order.
- **Out of window**: Past the `refundableUntil` date → denial or VIP store credit.
- **High-value**: `amount > 5000` → escalate decision.
- **Risk flagged**: Customer with `riskFlag` set → escalation regardless of window.

You can tweak `lib/data/crm.ts` and `lib/data/policy.ts` to match stricter or more lenient business rules.

---

## 🗺️ Roadmap / Ideas

- Wire `/api/support/logs/:id` to a real log store (Redis, DB) and render full node-level reasoning in `/admin`.
- Add a proper **voice bot worker** that joins a realtime audio room (for example using LiveKit) and streams ASR → agent → TTS.
- Add persistable conversations with a database.
- Add authentication for admin views.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🙋‍♂️ Author

Built by **Flacko-07** as a demo of a production-style AI customer support refund agent using LangGraph, a self-hosted LLM, and a modern Next.js frontend.
