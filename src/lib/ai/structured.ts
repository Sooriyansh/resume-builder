import type { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "./model";

export async function generateStructured<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  untrustedText: string,
): Promise<z.infer<T>> {
  const model = getChatModel().withStructuredOutput(schema);
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(`UNTRUSTED_DOCUMENT_DATA:\n${untrustedText.slice(0, 80_000)}`),
      ]);
      return schema.parse(output);
    } catch (error) {
      lastError = error;
      const apiError = error as { code?: string; status?: number };
      if (apiError.code === "insufficient_quota" || apiError.status === 401) break;
    }
  }

  throw new Error("AI returned invalid structured data", { cause: lastError });
}
