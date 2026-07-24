import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { storage } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const resume = await db.resume.findFirst({
    where: { id, userId },
    omit: { storagePath: true },
  });
  return resume ? ok(resume) : fail("NOT_FOUND", "Resume not found.", 404);
}

export async function DELETE(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const resume = await db.resume.findFirst({
    where: { id, userId },
    select: { id: true, storagePath: true },
  });
  if (!resume) return fail("NOT_FOUND", "Resume not found.", 404);
  await db.resume.delete({ where: { id: resume.id } });
  await storage.delete(resume.storagePath);
  return ok({ deleted: true });
}
