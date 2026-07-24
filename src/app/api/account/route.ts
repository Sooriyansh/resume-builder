import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";
import { storage } from "@/lib/storage";

export async function DELETE() {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const resumes = await db.resume.findMany({ where: { userId }, select: { storagePath: true } });
  await db.user.delete({ where: { id: userId } });
  await Promise.allSettled(resumes.map((resume) => storage.delete(resume.storagePath)));
  return ok({ deleted: true });
}
