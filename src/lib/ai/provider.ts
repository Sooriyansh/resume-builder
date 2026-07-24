import { z } from "zod";

const providerSchema = z.enum(["openai", "compatible"]);

export function getAIConfig() {
  return {
    provider: providerSchema.parse(process.env.AI_PROVIDER ?? "openai"),
    apiKey: z.string().min(1).parse(process.env.OPENAI_API_KEY),
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  };
}
