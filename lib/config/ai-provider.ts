import { openai } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider-v2";

export type AIProvider = "openai" | "ollama";

function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "ollama") {
    return "ollama";
  }
  return "openai";
}

function getOllamaBaseURL(): string {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || "llama3.2";
}

function validateOpenAIConfig() {
  if (getAIProvider() === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required when using OpenAI provider. Set AI_PROVIDER=ollama to use Ollama instead."
    );
  }
}

export function getLanguageModel(modelName?: string) {
  const provider = getAIProvider();

  if (provider === "ollama") {
    const ollama = createOllama({
      baseURL: getOllamaBaseURL(),
    });
    return ollama(getOllamaModel());
  }

  validateOpenAIConfig();
  return openai(modelName || "gpt-4o-mini");
}

export function getEmbeddingModel() {
  const provider = getAIProvider();

  if (provider === "ollama") {
    const ollama = createOllama({
      baseURL: getOllamaBaseURL(),
    });
    return ollama.embedding(getOllamaModel());
  }

  validateOpenAIConfig();
  return openai.embedding("text-embedding-3-small");
}

export function getCurrentProvider(): AIProvider {
  return getAIProvider();
}
