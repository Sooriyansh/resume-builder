import { ChatOpenAI } from "@langchain/openai";
import { getAIConfig } from "./provider";

export function getChatModel() {
  const config = getAIConfig();
  return new ChatOpenAI({
    apiKey: config.apiKey,
    configuration: config.baseURL ? { baseURL: config.baseURL } : undefined,
    model: config.chatModel,
    temperature: 0,
    maxRetries: 2,
    timeout: 30_000,
  });
}
