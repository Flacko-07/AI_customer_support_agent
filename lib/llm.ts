// lib/llm.ts
import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  modelName: process.env.MODEL_NAME || "llama3.2:3b",
  temperature: 0,
  apiKey: process.env.LLM_API_KEY || "ollama", // Ollama ignores this but needs a value
  configuration: {
    baseURL: process.env.LLM_BASE_URL || "http://localhost:11434/v1",
  },
});