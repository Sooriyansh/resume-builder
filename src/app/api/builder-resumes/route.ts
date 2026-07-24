import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { builderResumeSchema, defaultResumeSettings, emptyResumeData } from "@/lib/resume-builder";

export async function GET() {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const resumes = await db.builderResume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, template: true, data: true, updatedAt: true, createdAt: true },
  });
  return ok(resumes);
}

export async function POST(request: Request) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const input = builderResumeSchema.safeParse(await request.json().catch(() => ({
    title: "Untitled Resume",
    template: "modern",
    data: emptyResumeData,
    settings: defaultResumeSettings,
  })));
  if (!input.success) return fail("INVALID_RESUME", "Check the resume fields.", 400);
  const duplicate = await db.builderResume.findFirst({
    where: { userId, title: input.data.title },
  });
  const title = duplicate ? `${input.data.title} Copy` : input.data.title;
  const resume = await db.builderResume.create({
    data: { userId, ...input.data, title },
  });
  return ok(resume, 201);
}
