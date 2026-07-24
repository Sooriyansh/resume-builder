import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { extractText } from "@/lib/resume/extract-text";
import { storage } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("FILE_REQUIRED", "Choose a resume.", 400, "file");
  if (file.size > MAX_FILE_SIZE) return fail("FILE_TOO_LARGE", "Maximum file size is 5 MB.", 413);
  if (file.size === 0) return fail("EMPTY_FILE", "The uploaded file is empty.", 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const extracted = await extractText(buffer, file.name);
    const saved = await storage.save(userId, buffer);
    try {
      const resume = await db.resume.create({
        data: {
          userId,
          originalFilename: file.name.slice(0, 255),
          storagePath: saved.path,
          mimeType: extracted.mimeType,
          fileSize: file.size,
          extractedText: extracted.text,
          extractionWarnings: extracted.extractionWarnings,
        },
        select: { id: true, originalFilename: true, status: true, createdAt: true },
      });
      return ok({ resume, extraction: extracted }, 201);
    } catch (error) {
      await storage.delete(saved.path);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resume extraction failed.";
    const status = message.includes("signature") ? 415 : 422;
    return fail("EXTRACTION_FAILED", message, status);
  }
}
