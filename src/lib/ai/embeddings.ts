import { OpenAIEmbeddings } from "@langchain/openai";
import { getAIConfig } from "./provider";

export function getEmbeddings() {
  const config = getAIConfig();
  return new OpenAIEmbeddings({
    apiKey: config.apiKey,
    configuration: config.baseURL ? { baseURL: config.baseURL } : undefined,
    model: config.embeddingModel,
    batchSize: 64,
    maxRetries: 2,
    timeout: 30_000,
  });
}
