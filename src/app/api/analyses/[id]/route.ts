import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const analysis = await db.analysis.findFirst({
    where: { id, userId },
    include: { resume: { select: { originalFilename: true } }, jobDescription: true },
  });
  return analysis ? ok(analysis) : fail("NOT_FOUND", "Analysis not found.", 404);
}

export async function DELETE(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const deleted = await db.analysis.deleteMany({ where: { id, userId } });
  return deleted.count ? ok({ deleted: true }) : fail("NOT_FOUND", "Analysis not found.", 404);
}
