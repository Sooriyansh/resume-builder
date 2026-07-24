import { db } from "@/lib/db";
import { fail } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { resumeDataSchema } from "@/lib/resume-builder";
import { createResumePdf } from "@/lib/resume/pdf-export";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await context.params;
  const record = await db.builderResume.findFirst({ where: { id, userId }, select: { title: true, data: true } });
  if (!record) return fail("NOT_FOUND", "Resume not found.", 404);
  const data = resumeDataSchema.parse(record.data);
  const pdf = await createResumePdf(data);
  const filename = `${record.title.replace(/[^a-z0-9_-]+/gi, "-") || "resume"}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
