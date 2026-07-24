import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { builderResumeSchema } from "@/lib/resume-builder";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const resume = await db.builderResume.findFirst({ where: { id, userId } });
  return resume ? ok(resume) : fail("NOT_FOUND", "Resume not found.", 404);
}

export async function PUT(request: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const input = builderResumeSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return fail("INVALID_RESUME", "Check highlighted resume fields.", 400);
  const existing = await db.builderResume.findFirst({ where: { id, userId } });
  if (!existing) return fail("NOT_FOUND", "Resume not found.", 404);
  return ok(await db.builderResume.update({ where: { id }, data: input.data }));
}

export async function DELETE(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const deleted = await db.builderResume.deleteMany({ where: { id, userId } });
  return deleted.count ? ok({ deleted: true }) : fail("NOT_FOUND", "Resume not found.", 404);
}
