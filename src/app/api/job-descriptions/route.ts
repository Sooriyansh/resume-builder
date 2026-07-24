import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { parsedJobDescriptionSchema } from "@/lib/schemas";
import { generateStructured } from "@/lib/ai/structured";
import { JOB_DESCRIPTION_PARSER_PROMPT } from "@/lib/ai/prompts/job-description-parser";
import { parseJobDescriptionLocally } from "@/lib/ai/local-parser";

const inputSchema = z.object({
  title: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  rawText: z.string().trim().min(100).max(50_000),
});

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_JOB_DESCRIPTION", "Add at least 100 characters.", 400);
  try {
    const parsed = await generateStructured(
      parsedJobDescriptionSchema,
      JOB_DESCRIPTION_PARSER_PROMPT,
      input.data.rawText,
    );
    const job = await db.jobDescription.create({
      data: {
        userId,
        title: input.data.title || parsed.jobTitle,
        companyName: input.data.companyName || parsed.companyName,
        rawText: input.data.rawText,
        parsedData: parsed,
      },
    });
    return ok(job, 201);
  } catch (error) {
    console.warn("AI job parsing unavailable; using local parser.", error);
    const parsed = parsedJobDescriptionSchema.parse(
      parseJobDescriptionLocally(input.data.rawText, input.data.title, input.data.companyName),
    );
    const job = await db.jobDescription.create({
      data: {
        userId,
        title: input.data.title || parsed.jobTitle,
        companyName: input.data.companyName || parsed.companyName,
        rawText: input.data.rawText,
        parsedData: parsed,
      },
    });
    return ok({ ...job, parsingMode: "local" }, 201);
  }
}
