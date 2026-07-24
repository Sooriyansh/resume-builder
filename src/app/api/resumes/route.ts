import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/require-user";

export async function GET() {
  const userId = await requireUser();
  if (!userId) return fail("UNAUTHENTICATED", "Please sign in.", 401);
  return ok(await db.resume.findMany({
    where: { userId },
    select: { id: true, originalFilename: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  }));
}
