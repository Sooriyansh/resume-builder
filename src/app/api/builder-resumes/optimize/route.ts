import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { resumeDataSchema, resumeSettingsSchema } from "@/lib/resume-builder";
import { optimizeBuilderResume } from "@/lib/resume/ats-optimizer";

const schema = z.object({
  data: resumeDataSchema,
  settings: resumeSettingsSchema,
  jobDescription: z.string().max(50_000).default(""),
});

export async function POST(request: Request) {
  if (!await requireUser()) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_INPUT", "The resume could not be optimized.", 400);
  return ok(optimizeBuilderResume(input.data.data, input.data.settings, input.data.jobDescription));
}
