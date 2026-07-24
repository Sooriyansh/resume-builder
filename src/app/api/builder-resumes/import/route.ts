import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { extractText } from "@/lib/resume/extract-text";
import { parseResumeLocally } from "@/lib/ai/local-parser";
import {
  defaultResumeSettings, parsedResumeToBuilderData, resumeDataSchema,
} from "@/lib/resume-builder";
import { optimizeBuilderResume } from "@/lib/resume/ats-optimizer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const extensions = new Set(["pdf", "docx", "txt"]);

export async function POST(request: Request) {
  const userId = await requireUser();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("FILE_REQUIRED", "Choose a resume file.", 400);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!extensions.has(extension)) {
    return fail("UNSUPPORTED_FILE", "Use a PDF, DOCX, or TXT resume.", 415);
  }
  if (!file.size) return fail("EMPTY_FILE", "The selected file is empty.", 422);
  if (file.size > MAX_FILE_SIZE) return fail("FILE_TOO_LARGE", "Maximum file size is 5 MB.", 413);

  try {
    const extracted = await extractText(Buffer.from(await file.arrayBuffer()), file.name);
    const parsed = parseResumeLocally(extracted.text);
    const data = resumeDataSchema.parse(parsedResumeToBuilderData(parsed));
    const optimized = optimizeBuilderResume(
      data,
      { ...defaultResumeSettings, showPhoto: false },
      String(form.get("jobDescription") ?? "").slice(0, 50_000),
    );
    const confidenceWarnings = [
      !data.fullName && "Full name was not confidently detected.",
      !data.professionalTitle && "Professional title needs review.",
      !data.email && "Email address was not detected.",
      !data.phone && "Phone number was not detected.",
      !data.location && "Location needs review.",
      !data.experience.length && "Work experience entries need review.",
      !data.education.length && "Education entries need review.",
    ].filter((warning): warning is string => Boolean(warning));
    const cleanName = file.name.replace(/\.(pdf|docx|txt)$/i, "").slice(0, 90);
    const resume = await db.builderResume.create({
      data: {
        userId,
        title: `${cleanName} · Rebuilt`,
        template: "ats",
        data: optimized.data,
        settings: optimized.settings,
      },
      select: { id: true, title: true },
    });
    return ok({
      resume,
      extraction: {
        pageCount: extracted.pageCount,
        wordCount: extracted.wordCount,
        characterCount: extracted.characterCount,
        warnings: [...extracted.extractionWarnings, ...confidenceWarnings],
      },
      optimization: {
        report: optimized.report,
        changes: optimized.changes,
        safety: "Only extracted information was cleaned, reordered, or emphasized. No facts, skills, metrics, qualifications, employers, or dates were invented.",
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume extraction failed.";
    return fail("IMPORT_FAILED", message, message.includes("signature") ? 415 : 422);
  }
}
