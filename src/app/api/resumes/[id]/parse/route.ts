import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { parsedResumeSchema } from "@/lib/schemas";
import { generateStructured } from "@/lib/ai/structured";
import { RESUME_PARSER_PROMPT } from "@/lib/ai/prompts/resume-parser";
import { parseResumeLocally } from "@/lib/ai/local-parser";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const resume = await db.resume.findFirst({ where: { id, userId } });
  if (!resume) return fail("NOT_FOUND", "Resume not found.", 404);
  if (!resume.extractedText) return fail("NO_TEXT", "Resume has no extracted text.", 422);
  try {
    const parsed = await generateStructured(parsedResumeSchema, RESUME_PARSER_PROMPT, resume.extractedText);
    await db.resume.update({ where: { id }, data: { parsedData: parsed, status: "PARSED" } });
    return ok(parsed);
  } catch (error) {
    console.warn("AI resume parsing unavailable; using local parser.", error);
    const parsed = parsedResumeSchema.parse(parseResumeLocally(resume.extractedText));
    await db.resume.update({ where: { id }, data: { parsedData: parsed, status: "PARSED" } });
    return ok({ ...parsed, parsingMode: "local" });
  }
}
