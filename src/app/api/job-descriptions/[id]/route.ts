import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const job = await db.jobDescription.findFirst({ where: { id, userId } });
  return job ? ok(job) : fail("NOT_FOUND", "Job description not found.", 404);
}

export async function DELETE(_: Request, { params }: Context) {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  const { id } = await params;
  const result = await db.jobDescription.deleteMany({ where: { id, userId } });
  return result.count ? ok({ deleted: true }) : fail("NOT_FOUND", "Job description not found.", 404);
}
